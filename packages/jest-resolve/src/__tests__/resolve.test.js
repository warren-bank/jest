/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

jest.mock('../__mocks__/userResolver');

const fs = require('fs');
const path = require('path');
const ModuleMap = require('jest-haste-map').ModuleMap;
const Resolver = require('../');
const userResolver = require('../__mocks__/userResolver');

beforeEach(() => {
  userResolver.mockClear();
});

describe('isCoreModule', () => {
  it('returns false if `hasCoreModules` is false.', () => {
    const moduleMap = new ModuleMap();
    const resolver = new Resolver(moduleMap, {
      hasCoreModules: false,
    });
    const isCore = resolver.isCoreModule('assert');
    expect(isCore).toEqual(false);
  });

  it('returns true if `hasCoreModules` is true and `moduleName` is a core module.', () => {
    const moduleMap = new ModuleMap();
    const resolver = new Resolver(moduleMap, {});
    const isCore = resolver.isCoreModule('assert');
    expect(isCore).toEqual(true);
  });

  it('returns false if `hasCoreModules` is true and `moduleName` is not a core module.', () => {
    const moduleMap = new ModuleMap();
    const resolver = new Resolver(moduleMap, {});
    const isCore = resolver.isCoreModule('not-a-core-module');
    expect(isCore).toEqual(false);
  });
});

describe('findNodeModule', () => {
  it('is possible to override the default resolver', () => {
    const cwd = process.cwd();
    const resolvedCwd = fs.realpathSync(cwd) || cwd;
    const nodePaths = process.env.NODE_PATH
      ? process.env.NODE_PATH.split(path.delimiter)
          .filter(Boolean)
          .map(p => path.resolve(resolvedCwd, p))
      : null;

    userResolver.mockImplementation(() => 'module');

    const newPath = Resolver.findNodeModule('test', {
      basedir: '/',
      browser: true,
      extensions: ['js'],
      moduleDirectory: ['node_modules'],
      paths: ['/something'],
      resolver: require.resolve('../__mocks__/userResolver'),
    });

    expect(newPath).toBe('module');
    expect(userResolver.mock.calls[0][0]).toBe('test');
    expect(userResolver.mock.calls[0][1]).toEqual({
      basedir: '/',
      browser: true,
      extensions: ['js'],
      moduleDirectory: ['node_modules'],
      paths: (nodePaths || []).concat(['/something']),
    });
  });
});

describe('resolveModule', () => {
  let moduleMap;
  beforeEach(() => {
    moduleMap = new ModuleMap({
      duplicates: [],
      map: [],
      mocks: [],
    });
  });

  it('is possible to resolve node modules', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    });
    const src = require.resolve('../');
    const resolved = resolver.resolveModule(
      src,
      './__mocks__/mockJsDependency',
    );
    expect(resolved).toBe(require.resolve('../__mocks__/mockJsDependency.js'));
  });

  it('is possible to resolve node modules with custom extensions', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js', '.jsx'],
    });
    const src = require.resolve('../');
    const resolvedJsx = resolver.resolveModule(
      src,
      './__mocks__/mockJsxDependency',
    );
    expect(resolvedJsx).toBe(
      require.resolve('../__mocks__/mockJsxDependency.jsx'),
    );
  });

  it('is possible to resolve node modules with custom extensions and platforms', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js', '.jsx'],
      platforms: ['native'],
    });
    const src = require.resolve('../');
    const resolvedJsx = resolver.resolveModule(
      src,
      './__mocks__/mockJsxDependency',
    );
    expect(resolvedJsx).toBe(
      require.resolve('../__mocks__/mockJsxDependency.native.jsx'),
    );
  });
});

describe('getMockModule', () => {
  it('is possible to use custom resolver to resolve deps inside mock modules with moduleNameMapper', () => {
    userResolver.mockImplementation(() => 'module');

    const moduleMap = new ModuleMap({
      duplicates: [],
      map: [],
      mocks: [],
    });
    const resolver = new Resolver(moduleMap, {
      moduleNameMapper: [
        {
          moduleName: '$1',
          regex: /(.*)/,
        },
      ],
      resolver: require.resolve('../__mocks__/userResolver'),
    });
    const src = require.resolve('../');
    resolver.getMockModule(src, 'dependentModule');

    expect(userResolver).toHaveBeenCalled();
    expect(userResolver.mock.calls[0][0]).toBe('dependentModule');
    expect(userResolver.mock.calls[0][1]).toHaveProperty(
      'basedir',
      path.dirname(src),
    );
  });

  it('is possible to use custom resolver to resolve deps inside mock modules without moduleNameMapper', () => {
    userResolver.mockImplementation(() => 'module');

    const moduleMap = new ModuleMap({
      duplicates: [],
      map: [],
      mocks: [],
    });
    const resolver = new Resolver(moduleMap, {
      resolver: require.resolve('../__mocks__/userResolver'),
    });
    const src = require.resolve('../');
    resolver.getMockModule(src, 'dependentModule');

    expect(userResolver).toHaveBeenCalled();
    expect(userResolver.mock.calls[0][0]).toBe('dependentModule');
    expect(userResolver.mock.calls[0][1]).toHaveProperty(
      'basedir',
      path.dirname(src),
    );
  });
});

describe('Resolver.getModulePaths() -> nodeModulesPaths()', () => {
  let moduleMap;

  const path_methods = {
    cache: {},
    names: ['dirname', 'resolve', 'parse', 'isAbsolute', 'join'],
    platform: '',
  };

  const save_path = () => {
    path_methods.platform =
      path.resolve === path.win32.resolve ? 'win32' : 'posix';

    path_methods.names.forEach(name => {
      path_methods.cache[name] = path[name];
    });
  };

  const update_path = os => {
    path_methods.names.forEach(name => {
      path[name] = path[os][name];
    });
  };

  const restore_path = () => {
    const os = path_methods.platform;

    path_methods.names.forEach(name => {
      path[os][name] = path_methods.cache[name];
      path[name] = path_methods.cache[name];
    });
  };

  beforeEach(() => {
    moduleMap = new ModuleMap({
      duplicates: [],
      map: [],
      mocks: [],
    });
  });

  const test_win32 = expect => {
    const cwd = 'D:\\project';
    const src = 'C:\\path\\to\\node_modules';
    const resolver = new Resolver(moduleMap, {
      moduleDirectories: [src, 'node_modules'],
    });
    const dirs_expected = [
      src,
      cwd + '\\node_modules',
      path.dirname(cwd).replace(/\\$/, '') + '\\node_modules',
    ];
    const dirs_actual = resolver.getModulePaths(cwd);
    expect(dirs_actual).toEqual(expect.arrayContaining(dirs_expected));
  };

  const test_posix = expect => {
    const cwd = '/temp/project';
    const src = '/root/path/to/node_modules';
    const resolver = new Resolver(moduleMap, {
      moduleDirectories: [src, 'node_modules'],
    });
    const dirs_expected = [
      src,
      cwd + '/node_modules',
      path.dirname(cwd) + '/node_modules',
      '/node_modules',
    ];
    const dirs_actual = resolver.getModulePaths(cwd);
    expect(dirs_actual).toEqual(expect.arrayContaining(dirs_expected));
  };

  // run tests sequentially
  it('can resolve node modules relative to absolute paths in "moduleDirectories" on all platforms', () => {
    return Promise.resolve(expect)
    .then(expect => {
        save_path();
        return expect;
    })
    .then(expect => {
        update_path('win32');
        test_win32(expect);
        restore_path();
        return expect;
    })
    .then(expect => {
        update_path('posix');
        test_posix(expect);
        restore_path();
        return expect;
    })
    .catch(error => {
        restore_path();
        throw error;
    });
  });
});
