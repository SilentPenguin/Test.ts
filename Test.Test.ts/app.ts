/// <reference path="../test.ts/assert.ts" />
/// <reference path="../test.ts/report.ts" />
/// <reference path="../test.ts/test.ts" />

class MyTest extends Test.Case {
    something: any;

    before(): void {
        this.something = { "test" : true };
    }

    @test
    SomethingIsDefined(): void {
        Assert.that(this.something).is.defined
    }

    @skip.because('test skipped for reasons')
    @test
    SomethingIsTrue(): void {
        Assert.that(this.something).is.true();
        this.something = false;
    }

    @test
    SomethingIsFive(): void {
        Assert.that(this.something).is.equal.to(5);
    }

    @test.must.fail
    SomethingIsFiveFail(): void {
        Assert.that(this.something).is.equal.to(5);
    }
}

window.onload = () => {
    new Report.Html(new MyTest).run();
    new Report.Console(new MyTest).run();
}