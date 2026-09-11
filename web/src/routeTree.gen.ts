/* eslint-disable */
// @ts-nocheck
// Generated-compatible seed. TanStack Router will overwrite this during build.

import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as ViRouteImport } from "./routes/vi";
import { Route as AppRouteImport } from "./routes/app";

const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
} as any);

const ViRoute = ViRouteImport.update({
  id: "/vi",
  path: "/vi",
  getParentRoute: () => rootRouteImport,
} as any);

const AppRoute = AppRouteImport.update({
  id: "/app",
  path: "/app",
  getParentRoute: () => rootRouteImport,
} as any);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/vi": typeof ViRoute;
  "/app": typeof AppRoute;
}

export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/vi": typeof ViRoute;
  "/app": typeof AppRoute;
}

export interface FileRoutesById {
  __root__: typeof rootRouteImport;
  "/": typeof IndexRoute;
  "/vi": typeof ViRoute;
  "/app": typeof AppRoute;
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "/" | "/vi" | "/app";
  fileRoutesByTo: FileRoutesByTo;
  to: "/" | "/vi" | "/app";
  id: "__root__" | "/" | "/vi" | "/app";
  fileRoutesById: FileRoutesById;
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute;
  ViRoute: typeof ViRoute;
  AppRoute: typeof AppRoute;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/vi": {
      id: "/vi";
      path: "/vi";
      fullPath: "/vi";
      preLoaderRoute: typeof ViRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/app": {
      id: "/app";
      path: "/app";
      fullPath: "/app";
      preLoaderRoute: typeof AppRouteImport;
      parentRoute: typeof rootRouteImport;
    };
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  ViRoute,
  AppRoute,
};

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();

import type { getRouter } from "./router.tsx";
import type { startInstance } from "./start.ts";
declare module "@tanstack/react-start" {
  interface Register {
    ssr: true;
    router: Awaited<ReturnType<typeof getRouter>>;
    config: Awaited<ReturnType<typeof startInstance.getOptions>>;
  }
}
