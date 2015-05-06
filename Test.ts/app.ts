/// <reference path="test.ts" />

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

class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
    }

    stop() {
        clearTimeout(this.timerToken);
    }

}

window.onload = () => {
    var el = document.getElementById('content');
    var greeter = new Greeter(el);
    greeter.start();
};