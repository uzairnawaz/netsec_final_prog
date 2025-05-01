let buf = new ArrayBuffer(8);
let flt = new Float64Array(buf);
let int = new Uint32Array(buf);

export function floatToHexStr(f) {
  flt[0] = f;
  return `0x${Number(int[1]).toString(16).padStart(8,'0')}${Number(int[0]).toString(16).padStart(8,'0')}`;
}
export function floatToIntArr(f) {
  flt[0] = f;
  return [int[0], int[1]];
}
