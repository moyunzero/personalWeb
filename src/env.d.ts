/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/** Subpath types for three.js loaders (package exports + no root tsconfig). */
declare module 'three/examples/jsm/loaders/HDRLoader.js' {
    import type { DataTextureLoader, LoadingManager, TextureDataType } from 'three';

    export class HDRLoader extends DataTextureLoader {
        type: TextureDataType;
        constructor(manager?: LoadingManager);
        setDataType(type: TextureDataType): this;
    }
}

declare module 'three/addons/loaders/HDRLoader.js' {
    export { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
}
