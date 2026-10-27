// Next's worker count does not limit Node's internal V8 and libuv pools.
// Pass these settings at process startup so forked build workers inherit them.
function buildEnvironment(environment = process.env) {
  return {
    ...environment,
    UV_THREADPOOL_SIZE: '1',
    RAYON_NUM_THREADS: '1',
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: `${environment.NODE_OPTIONS || ''} --v8-pool-size=1`.trim(),
  };
}

module.exports = { buildEnvironment };
