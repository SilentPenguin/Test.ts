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

    export class Case implements ICase {
        fixtures: IFixture[];
        assert: Assert.IAssert;

        constructor() {
            this.fixtures = this.getfixtures();
        }

        run(): void {
            this.fixtures.forEach(fixture => fixture.run());
        }

        getfixtures(): IFixture[] {
            var result: IFixture[] = [];

            for (var property in this) {
                if (this[property] instanceof Function && property.substring(0, 4) == "test") {
                    result.push(new Fixture(this[property], this["before"], this["after"]));
                }
            }

            return result;
        }
    }

    class Fixture implements IFixture {
        func: ITest;
        before: Function;
        after: Function;
        result: IResult;

        constructor(func: ITest, before: Function, after: Function) {
            this.func = func;
            this.before = before || new Function();
            this.after = after || new Function();
            this.result = new Result(func.intent || Intent.none);
        }

        run(): void {
            try {
                var context = { assert: new Assert.Assert() };
                this.before.call(context);
                this.func.call(context);
                this.after.call(context);
                this.result.pass();
            }
            catch(exception) {
                this.result.fail.because(exception.message);
            }
        }
    }

    class Result implements IResult {
        intent: Intent;
        state: State;
        message: string;

        constructor(intent: Intent) {
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

    interface ICase {
        assert: Assert.IAssert;
        run(): void;
    }

    interface IFixture {
        run(): void;
    }

    interface IResult {
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