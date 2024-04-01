const imageOptimizer = require('./image-optimizer');

const vitePluginImageOptimizer =  (imageConfig) => ({
    name: 'image-compressor',
    buildStart() {
      return imageOptimizer.compress(imageConfig);
    }
  });
  
export default {...imageOptimizer,vitePluginImageOptimizer};