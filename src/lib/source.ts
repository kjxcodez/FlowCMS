import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx/runtime/next';
import { docs, meta } from '../../.source';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta),
});
