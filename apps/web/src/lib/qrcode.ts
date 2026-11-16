/**
 * ISO/IEC 18004 Standard QR Code Matrix Generator (Byte Mode, ECC Level L)
 * Zero external dependencies — produces scannable 2D boolean matrices for SVG rendering.
 */

interface VersionSpec {
  version: number
  size: number
  dataBytes: number
  ecBytesPerBlock: number
  numBlocks1: number
  dataBytesPerBlock1: number
  numBlocks2: number
  dataBytesPerBlock2: number
  alignment: number[]
}

// Version table for ECC Level L (supports up to 152 UTF-8 bytes, ideal for URLs & TOTP URIs)
const VERSION_SPECS: VersionSpec[] = [
  { version: 1, size: 21, dataBytes: 19, ecBytesPerBlock: 7, numBlocks1: 1, dataBytesPerBlock1: 19, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [] },
  { version: 2, size: 25, dataBytes: 34, ecBytesPerBlock: 10, numBlocks1: 1, dataBytesPerBlock1: 34, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 18] },
  { version: 3, size: 29, dataBytes: 55, ecBytesPerBlock: 15, numBlocks1: 1, dataBytesPerBlock1: 55, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 22] },
  { version: 4, size: 33, dataBytes: 80, ecBytesPerBlock: 20, numBlocks1: 1, dataBytesPerBlock1: 80, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 26] },
  { version: 5, size: 37, dataBytes: 108, ecBytesPerBlock: 26, numBlocks1: 1, dataBytesPerBlock1: 108, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 30] },
  { version: 6, size: 41, dataBytes: 136, ecBytesPerBlock: 18, numBlocks1: 2, dataBytesPerBlock1: 68, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 34] },
  { version: 7, size: 45, dataBytes: 156, ecBytesPerBlock: 20, numBlocks1: 2, dataBytesPerBlock1: 78, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 22, 38] },
  { version: 8, size: 49, dataBytes: 194, ecBytesPerBlock: 24, numBlocks1: 2, dataBytesPerBlock1: 97, numBlocks2: 0, dataBytesPerBlock2: 0, alignment: [6, 24, 42] },
]

// GF(256) log/exp tables with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i])
    }
    poly = next
  }
  return poly
}

function rsEncode(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLength)
  const remainder = new Uint8Array(ecLength)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0]
    remainder.copyWithin(0, 1)
    remainder[ecLength - 1] = 0
    for (let j = 0; j < ecLength; j++) {
      remainder[j] ^= gfMul(gen[j + 1], factor)
    }
  }
  return remainder
}

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text)
  const spec = VERSION_SPECS.find((s) => utf8.length + 3 <= s.dataBytes) ?? VERSION_SPECS[VERSION_SPECS.length - 1]
  const payload = utf8.slice(0, spec.dataBytes - 3)

  // Build bit stream: Mode 0100 (Byte), 8-bit char count, payload bytes, terminator, pad bytes
  const bits: number[] = []
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1)
  }

  pushBits(0b0100, 4)
  pushBits(payload.length, 8)
  for (const byte of payload) pushBits(byte, 8)

  const maxDataBits = spec.dataBytes * 8
  const terminatorLen = Math.min(4, maxDataBits - bits.length)
  pushBits(0, terminatorLen)
  while (bits.length % 8 !== 0) bits.push(0)

  const dataCodewords = new Uint8Array(spec.dataBytes)
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j]
    dataCodewords[i] = b
  }
  let padToggle = true
  for (let i = bits.length / 8; i < spec.dataBytes; i++) {
    dataCodewords[i] = padToggle ? 0xec : 0x11
    padToggle = !padToggle
  }

  // Split into blocks and compute Reed-Solomon EC codewords
  const dataBlocks: Uint8Array[] = []
  const ecBlocks: Uint8Array[] = []
  let offset = 0
  for (let b = 0; b < spec.numBlocks1; b++) {
    const block = dataCodewords.slice(offset, offset + spec.dataBytesPerBlock1)
    offset += spec.dataBytesPerBlock1
    dataBlocks.push(block)
    ecBlocks.push(rsEncode(block, spec.ecBytesPerBlock))
  }

  // Interleave data and EC codewords
  const finalBytes: number[] = []
  const maxBlockLen = spec.dataBytesPerBlock1
  for (let i = 0; i < maxBlockLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) finalBytes.push(block[i])
    }
  }
  for (let i = 0; i < spec.ecBytesPerBlock; i++) {
    for (const ec of ecBlocks) {
      if (i < ec.length) finalBytes.push(ec[i])
    }
  }

  const size = spec.size
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark
      isFunction[r][c] = true
    }
  }

  // Finder patterns + separators
  const drawFinder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr
        const c = col + dc
        if (r < 0 || r >= size || c < 0 || c >= size) continue
        const inOuter = dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)
        const inTopBot = dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        setFunctionModule(r, c, inOuter || inTopBot || inInner)
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0)
    setFunctionModule(i, 6, i % 2 === 0)
  }

  // Alignment patterns
  const align = spec.alignment
  for (const r of align) {
    for (const c of align) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
          setFunctionModule(r + dr, c + dc, dark)
        }
      }
    }
  }

  // Reserve format info areas & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunctionModule(8, i, false)
      setFunctionModule(i, 8, false)
    }
    if (i < 8) {
      setFunctionModule(8, size - 1 - i, false)
      setFunctionModule(size - 1 - i, 8, false)
    }
  }
  setFunctionModule(size - 8, 8, true)

  // Place data bits in upward/downward 2-column zig-zag
  let bitIdx = 0
  const totalBits = finalBytes.length * 8
  let upward = true
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert
      for (let j = 0; j < 2; j++) {
        const c = right - j
        if (!isFunction[r][c]) {
          let dark = false
          if (bitIdx < totalBits) {
            dark = ((finalBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1
            bitIdx++
          }
          // Apply Mask Pattern 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) dark = !dark
          modules[r][c] = dark
        }
      }
    }
    upward = !upward
  }

  // Format information bits for ECC Level L (01) and Mask 0 (000) -> 0x77c4
  const formatBits = 0x77c4
  const getFormatBit = (i: number) => ((formatBits >>> i) & 1) === 1

  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getFormatBit(i))
  setFunctionModule(8, 7, getFormatBit(6))
  setFunctionModule(8, 8, getFormatBit(7))
  setFunctionModule(7, 8, getFormatBit(8))
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getFormatBit(i))

  for (let i = 0; i < 8; i++) setFunctionModule(8, size - 1 - i, getFormatBit(i))
  for (let i = 8; i < 15; i++) setFunctionModule(size - 15 + i, 8, getFormatBit(i))

  return modules
}
