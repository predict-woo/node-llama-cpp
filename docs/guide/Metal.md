---
description: Metal support in llama-cpp-node
---
# Metal Support
> Metal is a low-level 3D graphics and compute API created by Apple for Apple platforms

Metal support is enabled by default on macOS on Apple Silicon Macs, and is disabled by default on Intel Macs.

The pre-built binaries of `llama-cpp-node` for macOS are built with Metal support enabled for Apple Silicon Macs,
and when building from source on macOS on Apple Silicon Macs, Metal support is enabled by default.

`llama.cpp` doesn't support Metal well on Intel Macs, so it is disabled by default on those machines.

<div class="info custom-block" style="padding-top: 8px">

[Accelerate framework](https://developer.apple.com/accelerate/) is always enabled on Mac.

</div>

## Toggling Metal Support {#building}
### Prerequisites
* [`cmake-js` dependencies](https://github.com/cmake-js/cmake-js#:~:text=%5Bstring%5D-,Requirements%3A,-CMake)
* [CMake](https://cmake.org/download/) 3.26 or higher (optional, recommended if you have build issues)

### Building `llama-cpp-node` With Metal Support Disabled
Run this command inside of your project:
```shell
npx --no llama-cpp-node source download --gpu false
```

> If `cmake` is not installed on your machine, `llama-cpp-node` will automatically download `cmake` to an internal directory and try to use it to build `llama.cpp` from source.


### Building `llama-cpp-node` With Metal Support Enabled
Run this command inside of your project:
```shell
npx --no llama-cpp-node source download --gpu metal
```

> If `cmake` is not installed on your machine, `llama-cpp-node` will automatically download `cmake` to an internal directory and try to use it to build `llama.cpp` from source.
