/// <reference path="assert.ts" />
module Test {

    /*----------------*
     *     Enums      *
     *----------------*/

    enum Intent {
        none, //normal behaviour, passes pass, fails fail, skips skip.
        pass, //pass only, passes pass, everything else fails.
        fail  //fails only, fails pass, everything else fails.
    };

    enum State {
        none,
        pass, //test has passed
        fail, //test has failed
        skip  //test was not run
    };
        
    /*----------------*
     *   Decorators   *
     *----------------*/
    
    // @skip
    // @skip.if(boolean)
    // @skip.because(string)
    // @skip.if(boolean).because(string)

    // @test
    // @test.must.pass
    // @test.must.fail

    function SkipDecorator(): ISkipDecorator {
        var object: any = SkipIfDecorator(true);
        object.if = SkipIfDecorator;
        object.if.not = SkipIfNotDecorator;
        return object;
    }

    function SkipTest(skip: boolean = true, reason?: string): IMethodDecorator {
        if (skip) {
            return (target, key, descriptor) => {
                descriptor.value = () => { reason != null ? this.result.skip.because(reason) : this.result.skip(); }
            };
        } else {
            return (target, key, descriptor) => {
                descriptor;
            };
        }
    }

    function SkipIfDecorator(skip: boolean, invert: boolean = false): ISkipBaseDecorator {
        var object: any = SkipTest(skip != invert);
        if (!invert) {
            object.because = SkipBecauseDecorator(skip);
        }
        return object;
    }

    function SkipIfNotDecorator(skip: boolean) {
        return SkipIfDecorator(skip, true);
    }

    function SkipBecauseDecorator(skip: boolean): ISkipBecause {
        return function (reason: string): IMethodDecorator {
            return SkipTest(skip, reason);
        }
    }

    function TakeTest(intent: Intent) {
        return (target, key, descriptor) => {
            descriptor.value.intent = intent;
            return descriptor;
        }
    }

    function TestDecorator(): ITestDecorator {
        var object: any = TakeTest(Intent.none);
        object.must = TestMust();
        return object;
    }

    function TestMust(): ITestMust {
        return {
            pass: TakeTest(Intent.pass),
            fail: TakeTest(Intent.fail)
        };
    }

    export var skip: ISkipDecorator = SkipDecorator();
    export var test: ITestDecorator = TestDecorator();

    /*----------------*
     * Implementation *
     *----------------*/

    export class Set implements ISet {
        name: string;
        path: string;
        cases: IContainer[];

        constructor(path?: String) {
            this.name = (<any>this).constructor.name;
            this.path = (path ? path + '.' : '') + this.name;
            this.cases = [];
        }

        add(test: IContainer): void {
            this.cases.push(test);
        }

        run(): boolean {
            var result: boolean = true;
            this.cases.forEach(test => result = result && test.run());
            return result;
        }

        result(): IResult[] {
            var result: IResult[] = [];
            this.cases.forEach(test => result.concat(test.result()));
            return result;
        }
    }

    export class Case implements ICase {
        name: string;
        path: string;
        fixtures: IFixture[];

        constructor(path?: string) {
            this.name = (<any>this).constructor.name;
            this.path = (path ? path + '.' : '') +  this.name;
            this.fixtures = this.getfixtures();
        }

        run(): boolean {
            var result: boolean = true;
            this.fixtures.forEach(fixture => result = result && fixture.run());
            return result;
        }

        getfixtures(): IFixture[] {
            var result: IFixture[] = [],
                propIsFunc: boolean,
                propIsTest: boolean,
                fixture: IFixture;

            for (var property in this) {
                if (this[property] instanceof Function && (property.substring(0, 4) == "test" || this[property].intent != null)) {
                    fixture = new Fixture(property, this.path, this[property], this["before"], this["after"])
                    result.push(fixture);
                }
            }

            return result;
        }

        result(): IResult[] {
            var result: IResult[] = [];
            this.fixtures.forEach(fixture => result.push(fixture.result));
            return result;
        }
    }

    class Fixture implements IFixture {
        name: string;
        path: string;
        func: ITest;
        before: Function;
        after: Function;
        result: IResult;

        constructor(name: string, path: string, func: ITest, before: Function, after: Function) {
            this.name = name;
            this.path = path + '.' + name;
            this.func = func;
            this.before = before || new Function();
            this.after = after || new Function();
            this.result = new Result(this.path, func.intent || Intent.none);
        }

        run(): boolean {
            try {
                var context = { };
                this.before.call(context);
                this.func.call(context);
                this.after.call(context);
                this.result.pass();
            }
            catch(exception) {
                this.result.fail.because(exception.message);
            }

            return this.result.state != State.fail;
        }
    }

    class Result implements IResult {
        path: string
        intent: Intent;
        state: State;
        message: string;

        constructor(path: string, intent: Intent) {
            this.path = path;
            this.intent = intent;
            this.state = State.none;
            this.message = null;
        }

        pass: IPass = Pass.call(this);
        fail: IFail = Fail.call(this);
        skip: ISkip = Skip.call(this);
    }

    function Pass(): IPass {
        var object: any = (message?: string): void => {
            if (this.state != State.fail) {
                this.state = this.intent != Intent.fail ? State.pass : State.fail;
                this.message = message;
            }
        };

        object.because = object;

        return object;
    }

    function Fail(): IFail {
        var object: any = (message?: string): void => {
            if (this.state != State.fail) {
                this.state = this.intent != Intent.fail ? State.fail : State.pass;
                this.message = message;
            }
        };

        object.because = object;

        return object;
    }

    function Skip(): ISkip {
        var object: any = (message?: string): void => {
            if (this.state != State.fail) {
                this.state = this.intent != Intent.none ? State.skip : State.fail;
                this.message = message;
            }
        };

        object.because = object;

        return object;
    }

    /*----------------*
     *   Interfaces   *
     *----------------*/

    interface IRun {
        name: string;
        path: string;
        run(): boolean;
    }

    interface IContainer extends IRun {
        result(): IResult[];
    }

    interface ISet extends IContainer {
        add(test: ICase): void;
    }

    interface ICase extends IContainer { }

    interface IFixture extends IRun {
        result: IResult;
    }

    interface IResult {
        path: string;
        state: State;
        message: string;
        pass: IPass;
        fail: IFail;
        skip: ISkip;
    }

    interface IPass {
        (): void;
        because: IBecause;
    }

    interface IFail {
        (): void;
        because: IBecause;
    }

    interface ISkip {
        (): void;
        because: IBecause;
    }

    interface IBecause {
        (reason: string): void;
    }

    interface ITest {
        (): void;
        intent: Intent;
    }

    interface IMethodDecorator {
        (target, key, descriptor);
    }

    interface ITestDecorator extends IMethodDecorator {
        must: ITestMust;
    }

    interface ITestMust {
        pass: IMethodDecorator;
        fail: IMethodDecorator;
    }

    interface ISkipBaseDecorator extends IMethodDecorator {
        because: ISkipBecause;
    }

    interface ISkipDecorator extends ISkipBaseDecorator {
        if: ISkipIf;
    }

    interface ISkipBecause {
        (reason: string): IMethodDecorator;
    }

    interface ISkipIf {
        (skip: boolean): ISkipBaseDecorator;
        not: ISkipIfNot;
    }

    interface ISkipIfNot {
        (skip: boolean): ISkipBaseDecorator;
    }
}