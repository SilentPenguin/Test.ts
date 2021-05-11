# Test.ts

Test.ts is a light framework for simplified, component based testing. Each test is performed in a self contained environment, reducing the risk of state effects.

Test.ts also includes Assert.ts, a readable assertion library. You are free to use any library you wish, so long as it throws exceptions.

# What do the tests look like

Loosely inspired by python's unittest module, typescript uses decorators to mark methods as tests. These have been extended to describe specific conditions for that test. Below is a stripped down example of the structure used for a test case
  
```typescript
/// <reference path="test.ts" />
/// <reference path="assert.ts" />

class MyTestOfSomething extends Test.Case
{
    something: Item;

    before(): void {
        this.something = new Item();
    }
    
    after(): void {
        this.something.done();
    }
    
    @test
    Something(): void {
        Assert.that(this.something).is.defined();
    }
    
    @test.must.fail
    SomethingElse(): void {
        Assert.that(this.something).is.not.defined();
    }

    @skip
    @test
    Skipped(): void {
        Assert.that(false).is.true();
    }
}
```

# Getting Started
Please refer to the [wiki](https://github.com/SilentPenguin/Test.ts/wiki) for more infomation on working with Test.ts.
