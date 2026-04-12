#![forbid(unsafe_op_in_unsafe_fn)]

mod ffi;
mod runtime;

pub use runtime::{
    Simulation, INPUT_STRIDE, RENDER_STRIDE, SUMMARY_LEN,
};
