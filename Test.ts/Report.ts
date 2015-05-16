/// <reference path="test.ts" />

module Report {
    class Reporter {
        tests: Test.IContainer;
        lookup: any;
        duration: number;
        passed: boolean;

        constructor(tests: Test.IContainer) {
            this.tests = tests;
            this.lookup = {};
            this.lookup[Test.State.pass] = 'pass';
            this.lookup[Test.State.fail] = 'fail';
            this.lookup[Test.State.skip] = 'skip';
            this.lookup[Test.State.none] = 'none';
        }

        run() {
            var start = performance.now();
            this.passed = this.tests.run();
            this.duration = performance.now() - start;
        }

        protected timer() {
            return 'Tests completed in ' + this.duration.toFixed(2) + ' milliseconds.';
        }

        protected status(results: Test.IResult[]) {
            var passed = results.filter(item=> item.state == Test.State.pass).length,
                failed = results.filter(item=> item.state == Test.State.fail).length,
                skipped = results.filter(item=> item.state == Test.State.skip).length,
                messages = [];

            messages.push(results.length + ' test' + (results.length == 1 ? '' : 's') + ' discovered.');

            if (passed) {
                messages.push(passed + ' test' + (passed == 1 ? '' : 's') + ' passed.');
            }

            if (failed) {
                messages.push(failed + ' test' + (failed == 1 ? '' : 's') + ' failed.');
            }

            if (skipped) {
                messages.push(skipped + ' test' + (skipped == 1 ? '' : 's') + ' skipped.');
            }

            return messages.join(' ');
        }
    }

    export class Console extends Reporter {
        color: any;
        constructor(tests: Test.IContainer) {
            super(tests);
            this.color = {};
            this.color[Test.State.pass] = '#9CCF31';
            this.color[Test.State.fail] = '#FF9E00';
            this.color[Test.State.skip] = '#009ECE';
            this.color[Test.State.none] = '#808080';
        }

        run() {
            super.run();
            this.output();
        }

        output() {
            var results: Test.IResult[] = this.tests.results(),
                max: number = results.reduce(function (a, b) { return a.path.length > b.path.length ? a : b; }).path.length;
            console.log('%cinfo - ' + this.status(results), 'color: ' + this.color[this.passed ? Test.State.pass : Test.State.fail]);
            console.log('%cinfo - ' + this.timer(), 'color: ' + this.color[this.passed ? Test.State.pass : Test.State.fail]);
            results.forEach(result => this.line(result, max));
        }

        private line(result: Test.IResult, max: number): void {
            var path = result.path,
                message = [];

            while (path.length < max) {
                path += ' ';
            }

            message.push(this.lookup[result.state]);
            message.push(path);
            if (result.message) {
                message.push(result.message);
            }

            console.log('%c' + message.join(' - '), 'color: ' + this.color[result.state]);
        }
    }

    export class Html extends Reporter {
        run(element: HTMLElement = document.body) {
            super.run();
            this.output(element);
        }

        output(element: HTMLElement) {
            var results: Test.IResult[] = this.tests.results(),
            html = '<div class="status ' + (this.passed ? 'pass' : 'fail') + '">' + this.status(results) + '</div>';
            html += '<div class="timer ' + (this.passed ? 'pass' : 'fail') + '">' + this.timer() + '</div>';
            html += '<ol class="results">';
            results.forEach(result => html += this.line(result));
            html += '</ol>';
            element.innerHTML = html;
        }

        private line(result: Test.IResult): string {
            return '<li class="' + this.lookup[result.state] + '">' + result.path + (result.message ? '<pre>' + result.message + '</pre>' : '') + '</li>';
        }
    }
}