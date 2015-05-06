﻿/// <reference path="test.ts" />

class MyTest extends Test.Case {
    something: any;

    before(): void {
        this.something = { "test" : true };
    }

    test_something_defined(): void {
        this.assert.that(this.something).is.defined
    }

    test_something_true(): void {
        this.assert.that(this.something).is.true();
        this.something = false;
    }

    test_something_false(): void {
        this.assert.that(this.something).is.false();
    }
}