#!/usr/bin/env node
// @flow

import path from 'path';
import Api from 'ava/api';
import Logger from 'ava/lib/logger';
import VerboseReporter from 'ava/lib/reporters/verbose';


export default function Test(props: Object) {
    const TEST_DIR = process.cwd();

    const api = new Api({
        failFast: true,
        failWithoutAssertions: true,
        require: [
            'babel-register',
            path.resolve(__dirname, 'config', 'pretest'),
            props.require && path.resolve(props.require)
        ].filter(ii => ii),
        cacheEnabled: false,
        powerAssert: true,
        babelConfig: {
            babelrc: false,
            presets: ['blueflag'],
            sourceMaps: 'inline'
        },
        resolveTestsFrom: TEST_DIR,
        projectDir: TEST_DIR,
        timeout: '30s'
    });

    const reporter = new VerboseReporter({color: true});
    const logger = new Logger(reporter);

    logger.start();


    api.on('test-run', (runStatus: Object) => {
        reporter.api = runStatus;
        runStatus.on('test', logger.test);
        runStatus.on('error', logger.unhandledError);

        runStatus.on('stdout', logger.stdout);
        runStatus.on('stderr', logger.stderr);
    });

    api
        .run(props.glob
            ? [props.glob]
            : [
                props.monorepo
                    ? 'packages/*/!(lib)/**/*-test.js'
                    : 'src/**/*-test.js'
            ]
        )
        .then((runStatus: Object) => {
            logger.finish(runStatus);
            logger.exit(runStatus.failCount > 0 || runStatus.rejectionCount > 0 || runStatus.exceptionCount > 0 ? 1 : 0);
        })
        .catch((err: Error) => {
            // Don't swallow exceptions. Note that any expected error should already
            // have been logged.
            setImmediate(() => {
                throw err;
            });
        });
}

