/// <reference path="test.ts" />
/// <reference path="assert.ts" />

class MyTest extends Test.Case {
    something: any;

    before(): void {
        this.something = { "test" : true };
    }

    @test
    something_defined(): void {
        Assert.that(this.something).is.defined
    }

    @test
    something_true(): void {
        Assert.that(this.something).is.true();
        this.something = false;
    }

    @test
    something_false(): void {
        Assert.that(this.something).is.equal.to(5);
    }
}