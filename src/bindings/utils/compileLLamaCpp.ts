import path from "path";
import fs from "fs-extra";
import {
    buildMetadataFileName, llamaLocalBuildBinsDirectory,
    llamaPrebuiltBinsDirectory
} from "../../config.js";
import {BuildMetadataFile, BuildOptions} from "../types.js";
import {getModuleVersion} from "../../utils/getModuleVersion.js";

const buildConfigType: "Release" | "RelWithDebInfo" | "Debug" = "Release";

export async function getLocalBuildBinaryPath(folderName: string) {
    const binaryPath = path.join(llamaLocalBuildBinsDirectory, folderName, buildConfigType, "llama-addon.node");
    const buildMetadataFilePath = path.join(llamaLocalBuildBinsDirectory, folderName, buildConfigType, buildMetadataFileName);
    const buildDoneStatusPath = path.join(llamaLocalBuildBinsDirectory, folderName, "buildDone.status");

    const [
        binaryExists,
        buildMetadataExists,
        buildDoneStatusExists
    ] = await Promise.all([
        fs.pathExists(binaryPath),
        fs.pathExists(buildMetadataFilePath),
        fs.pathExists(buildDoneStatusPath)
    ]);

    if (binaryExists && buildMetadataExists && buildDoneStatusExists)
        return binaryPath;

    return null;
}

export async function getLocalBuildBinaryBuildMetadata(folderName: string) {
    const buildMetadataFilePath = path.join(llamaLocalBuildBinsDirectory, folderName, buildConfigType, buildMetadataFileName);

    if (!(await fs.pathExists(buildMetadataFilePath)))
        throw new Error(`Could not find build metadata file for local build "${folderName}"`);

    const buildMetadata: BuildMetadataFile = await fs.readJson(buildMetadataFilePath);
    return buildMetadata;
}

export async function getPrebuiltBinaryPath(buildOptions: BuildOptions, folderName: string) {
    const localPrebuiltBinaryDirectoryPath = path.join(llamaPrebuiltBinsDirectory, folderName);

    const binaryPath = await resolvePrebuiltBinaryPath(localPrebuiltBinaryDirectoryPath);

    if (binaryPath != null)
        return {
            binaryPath,
            folderName,
            folderPath: localPrebuiltBinaryDirectoryPath,
            extBackendsPath: undefined
        };

    const packagePrebuiltBinariesDirectoryPath = await getPrebuiltBinariesPackageDirectoryForBuildOptions(buildOptions);
    if (packagePrebuiltBinariesDirectoryPath == null)
        return null;

    const prebuiltBinariesDirPath = typeof packagePrebuiltBinariesDirectoryPath === "string"
        ? packagePrebuiltBinariesDirectoryPath
        : packagePrebuiltBinariesDirectoryPath.binsDir;
    const prebuiltBinariesExtDirPath = typeof packagePrebuiltBinariesDirectoryPath === "string"
        ? undefined
        : packagePrebuiltBinariesDirectoryPath.extBinsDir;

    const packagePrebuiltBinaryDirectoryPath = path.join(prebuiltBinariesDirPath, folderName);
    const extPackagePrebuiltBinaryDirectoryPath = prebuiltBinariesExtDirPath == null
        ? undefined
        : path.join(prebuiltBinariesExtDirPath, folderName);

    const binaryPathFromPackage = await resolvePrebuiltBinaryPath(packagePrebuiltBinaryDirectoryPath);

    if (binaryPathFromPackage != null)
        return {
            binaryPath: binaryPathFromPackage,
            folderName,
            folderPath: packagePrebuiltBinaryDirectoryPath,
            extBackendsPath: extPackagePrebuiltBinaryDirectoryPath
        };

    return null;
}

export async function getPrebuiltBinaryBuildMetadata(folderPath: string, folderName: string) {
    const buildMetadataFilePath = path.join(folderPath, buildMetadataFileName);

    if (!(await fs.pathExists(buildMetadataFilePath)))
        throw new Error(`Could not find build metadata file for prebuilt build "${folderName}"`);

    const buildMetadata: BuildMetadataFile = await fs.readJson(buildMetadataFilePath);
    return buildMetadata;
}

async function resolvePrebuiltBinaryPath(prebuiltBinaryDirectoryPath: string) {
    const binaryPath = path.join(prebuiltBinaryDirectoryPath, "llama-addon.node");
    const buildMetadataFilePath = path.join(prebuiltBinaryDirectoryPath, buildMetadataFileName);

    const [
        binaryExists,
        buildMetadataExists
    ] = await Promise.all([
        fs.pathExists(binaryPath),
        fs.pathExists(buildMetadataFilePath)
    ]);

    if (binaryExists && buildMetadataExists)
        return binaryPath;

    return null;
}

function getPrebuiltBinariesPackageDirectoryForBuildOptions(buildOptions: BuildOptions) {
    async function getBinariesPathFromModules(moduleImport: () => Promise<{getBinsDir(): {binsDir: string, packageVersion: string}}>) {
        try {
            const [
                binariesModule,
                currentModuleVersion
            ] = await Promise.all([
                moduleImport(),
                getModuleVersion()
            ]);
            const {binsDir, packageVersion} = binariesModule?.getBinsDir?.() ?? {};

            if (binsDir == null || packageVersion !== currentModuleVersion)
                return null;

            return binsDir;
        } catch (err) {
            return null;
        }
    }

    async function getBinariesPathFromModulesWithExtModule(
        moduleImport: () => Promise<{getBinsDir(): {binsDir: string, packageVersion: string}}>,
        extModuleImport: () => Promise<{getBinsDir(): {binsDir: string, packageVersion: string}}>
    ) {
        const [
            moduleBinsDir,
            extModuleBinsDir
        ] = await Promise.all([
            getBinariesPathFromModules(moduleImport),
            getBinariesPathFromModules(extModuleImport)
        ]);

        if (moduleBinsDir == null)
            return null;
        else if (extModuleBinsDir == null)
            return moduleBinsDir;

        return {
            binsDir: moduleBinsDir,
            extBinsDir: extModuleBinsDir
        };
    }

    /* eslint-disable import/no-unresolved */
    if (buildOptions.platform === "mac") {
        if (buildOptions.arch === "arm64" && buildOptions.gpu === "metal")
            // @ts-ignore
            return getBinariesPathFromModules(() => import("@node-llama-cpp/mac-arm64-metal"));
        else if (buildOptions.arch === "x64" && buildOptions.gpu === false)
            // @ts-ignore
            return getBinariesPathFromModules(() => import("@node-llama-cpp/mac-x64"));
    } else if (buildOptions.platform === "linux") {
        if (buildOptions.arch === "x64") {
            if (buildOptions.gpu === "cuda")
                return getBinariesPathFromModulesWithExtModule(
                    // @ts-ignore
                    () => import("@node-llama-cpp/linux-x64-cuda"),
                    // @ts-ignore
                    () => import("@node-llama-cpp/linux-x64-cuda-ext")
                );
            else if (buildOptions.gpu === "vulkan")
                // @ts-ignore
                return getBinariesPathFromModules(() => import("@node-llama-cpp/linux-x64-vulkan"));
            else if (buildOptions.gpu === false)
                // @ts-ignore
                return getBinariesPathFromModules(() => import("@node-llama-cpp/linux-x64"));
        } else if (buildOptions.arch === "arm64")
            // @ts-ignore
            return getBinariesPathFromModules(() => import("@node-llama-cpp/linux-arm64"));
        else if (buildOptions.arch === "arm")
            // @ts-ignore
            return getBinariesPathFromModules(() => import("@node-llama-cpp/linux-armv7l"));
    } else if (buildOptions.platform === "win") {
        if (buildOptions.arch === "x64") {
            if (buildOptions.gpu === "cuda")
                return getBinariesPathFromModulesWithExtModule(
                    // @ts-ignore
                    () => import("@node-llama-cpp/win-x64-cuda"),
                    // @ts-ignore
                    () => import("@node-llama-cpp/win-x64-cuda-ext")
                );
            else if (buildOptions.gpu === "vulkan")
                // @ts-ignore
                return getBinariesPathFromModules(() => import("@node-llama-cpp/win-x64-vulkan"));
            else if (buildOptions.gpu === false)
                // @ts-ignore
                return getBinariesPathFromModules(() => import("@node-llama-cpp/win-x64"));
        } else if (buildOptions.arch === "arm64")
            // @ts-ignore
            return getBinariesPathFromModules(() => import("@node-llama-cpp/win-arm64"));
    }
    /* eslint-enable import/no-unresolved */

    return null;
}
