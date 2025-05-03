# Final Project: WASM Exploitation

## Running

Run `exploit.js` as a JS module by doing `WebKit/Tools/Scripts/run-jsc --release -m exploit.js`, where `WebKit` is an old enough commit of the WebKit repo.

Only works on MacOS (as far as we know), as on Linux the heap is laid out differently.

## exploit.js

Implements `addrof` through the following steps:
- Creates enough arrays to reach the next heap arena.
- Compiles a WebKit module to make the data segment, with the following functions:
  - `readOOB()`: Uses the `array.init_data` bug to read out of bounds and return the destination array (as a WASM reference).
  - `get()`: Reads an index from the array (as a 64-bit floating point number).
- Creates many more arrays, each containing a magic number followed by an array ID.
- Reads out of bounds and finds an instance of the magic number.
  - Uses it to determine the ID of the overlapping `victim` array and the index in the destination array.
- Now `addrof` can be achieved by putting an object in the `victim` array, calling `readOOB()`, and retrieving the corresponding index from the destination array.

Abridged output:
```
addrof: 0x12d528260

<0x12d528260, Object>
  [0] 0x12d528260 : 0x0100180000009fa0 header
    ...
```

You can see that `addrof` successfully finds the object's address. It's also reusable.

## exploit2.js

Implements `headerof` to find a JSCell's header (and structure ID) through the following steps:
- Creates enough arrays to reach the next heap arena.
- Compiles a WebKit module to make the data segment, with the following functions:
  - `readOOB()`: Uses the `array.init_data` bug to read out of bounds and return the destination array (as a WASM reference).
  - `get()`: Reads an index from the array (as a 64-bit floating point number).
- To run `headerof`:
  - Creates many copies of the object, where every other one (alternating) ends with the magic number as its last property
  - Reads out of bounds and finds an instance of the magic number.
  - Reads after the magic number to find the start of the next instance of the object, reading its header

Abridged output:
```
headerof: 0x1001800000070b0

<0x12e784250, Object>
  [0] 0x12e784250 : 0x00001800000070b0 header
    structureID 28848 0x70b0 structure 0x3000070b0
    ...

headerof: 0x18000000a5c0

<0x12e54c400, Object>
  [0] 0x12e54c400 : 0x000018000000a5c0 header
    structureID 42432 0xa5c0 structure 0x30000a5c0
    ...
```

You can see that `headerof` successfully finds the object's header. It's also reusable.
This could be easily modified to find other information like butterfly pointers or inline properties.

### Limitations of `headerof`

The way we implemented it, this currently only works for objects with big enough JSCells (about 9 inline properties) to be allocated in the correct part of the heap, rather than lower down.
The way we create the objects with magic numbers also doesn't work for objects with out-of-line named properties, though it could be tweaked.
The biggest problem is that it will always be somewhat inconsistent because it depends on placing objects in the correct part of the heap, and finding some way to identify them without changing their structures.
