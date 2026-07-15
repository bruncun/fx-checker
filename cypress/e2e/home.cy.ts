type CurrenciesFixture = Array<{
  iso_code: string;
  name: string;
}>;

const defaultAppUrl = "/?amount=1000&amountSource=send";

function openSendCurrencyPickerWithKeyboard(currencyCode = "USD") {
  cy.findByRole("button", { name: currencyCode })
    .should("be.visible")
    .focus()
    .should("be.focused")
    .trigger("keydown", {
      code: "ArrowDown",
      key: "ArrowDown",
      keyCode: 40,
      which: 40,
    });

  cy.findByRole("dialog", { name: "Currency picker" }).should("be.visible");
  cy.findByRole("searchbox", { name: "Search currencies" }).should("be.focused");
}

describe("home page", () => {
  beforeEach(() => {
    cy.task("resetFrankfurterMock");
  });

  it("renders the converter-first app at the root", () => {
    cy.visit("/");

    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the Rate" }).should("be.visible");
    cy.findByRole("textbox", { name: "Email" }).should("not.exist");
    cy.findByRole("heading", { name: "Check the rate before money moves." }).should("not.exist");
  });

  it("opens auth forms as modals from the guest account menu", () => {
    cy.visit("/");

    cy.findByRole("button", { name: "Account menu" }).click();
    cy.findByRole("link", { name: "Log in" }).click();

    cy.location("pathname").should("eq", "/auth/login");
    cy.findByRole("heading", { name: "Check the Rate" }).should("be.visible");
    cy.findByRole("dialog", { name: "Login" }).within(() => {
      cy.findByRole("button", { name: "Close login" }).should("be.focused");
      cy.findByRole("textbox", { name: /Email/ }).should("be.visible");
      cy.findByRole("button", { name: "Login" }).should("be.visible");
      cy.findByRole("link", { name: "Forgot your password?" }).click();
    });

    cy.location("pathname").should("eq", "/auth/forgot-password");
    cy.findByRole("dialog", { name: "Reset Your Password" }).within(() => {
      cy.findByRole("textbox", { name: /Email/ }).should("be.visible");
      cy.findByRole("link", { name: "Login" }).click();
    });

    cy.findByRole("dialog", { name: "Login" }).within(() => {
      cy.findByRole("link", { name: "Sign up" }).click();
    });

    cy.location("pathname").should("eq", "/auth/sign-up");
    cy.findByRole("dialog", { name: "Sign up" }).within(() => {
      cy.findByRole("button", { name: "Close sign up" }).should("be.focused");
      cy.findByRole("textbox", { name: /Email/ }).should("be.visible");
      cy.findByRole("link", { name: "Login" }).click();
    });

    cy.findByRole("dialog", { name: "Login" }).within(() => {
      cy.findByRole("button", { name: "Close login" }).click();
    });
    cy.location("pathname").should("eq", "/");
    cy.findByRole("dialog", { name: "Login" }).should("not.exist");
  });

  it("swaps forgot-password modal content to the sent confirmation", () => {
    cy.intercept("POST", "/auth/forgot-password/action", {
      body: { error: null, success: true },
      delay: 200,
      statusCode: 200,
    }).as("forgotPassword");

    cy.visit("/");

    cy.findByRole("button", { name: "Account menu" }).click();
    cy.findByRole("link", { name: "Log in" }).click();
    cy.findByRole("dialog", { name: "Login" }).within(() => {
      cy.findByRole("link", { name: "Forgot your password?" }).click();
    });

    cy.findByRole("dialog", { name: "Reset Your Password" }).within(() => {
      cy.findByRole("textbox", { name: /Email/ }).type("user@example.test");
      cy.findByRole("button", { name: "Send reset email" }).click();
      cy.findByRole("button", { name: "Sending..." }).should("be.disabled");
    });

    cy.wait("@forgotPassword");
    cy.location("pathname").should("eq", "/auth/forgot-password/sent");
    cy.findByRole("dialog", { name: "Check Your Email" }).within(() => {
      cy.contains(/you will receive a password reset email/i).should("be.visible");
      cy.findByRole("link", { name: "Login" }).click();
    });
    cy.findByRole("dialog", { name: "Login" }).should("be.visible");
  });

  it("renders direct auth visits as standalone pages", () => {
    cy.visit("/auth/login");

    cy.contains("Login").should("be.visible");
    cy.findByRole("button", { name: "Login" }).should("be.visible");
    cy.findByRole("dialog", { name: "Login" }).should("not.exist");
    cy.findByRole("heading", { name: "Check the Rate" }).should("not.exist");

    cy.findByRole("link", { name: "Sign up" }).click();
    cy.location("pathname").should("eq", "/auth/sign-up");
    cy.findByRole("button", { name: "Sign up" }).should("be.visible");
    cy.findByRole("dialog", { name: "Sign up" }).should("not.exist");
    cy.findByRole("heading", { name: "Check the Rate" }).should("not.exist");

    cy.findByRole("link", { name: "Login" }).click();
    cy.location("pathname").should("eq", "/auth/login");
    cy.findByRole("link", { name: "Forgot your password?" }).click();
    cy.location("pathname").should("eq", "/auth/forgot-password");
    cy.findByRole("button", { name: "Send reset email" }).should("be.visible");
    cy.findByRole("dialog", { name: "Reset Your Password" }).should("not.exist");
    cy.findByRole("heading", { name: "Check the Rate" }).should("not.exist");

    cy.visit("/auth/forgot-password/sent");
    cy.contains(/you will receive a password reset email/i).should("be.visible");
    cy.findByRole("dialog", { name: "Check Your Email" }).should("not.exist");
  });

  it("offers guest mode from sign-up and starts the guest app at the top on mobile", () => {
    cy.viewport(375, 667);
    cy.visit("/auth/sign-up");

    cy.findByRole("button", { name: "Sign up" }).should("be.visible");
    cy.findByRole("link", { name: "Try as guest" }).should("have.attr", "href", "/guest").click();

    cy.location("pathname").should("eq", "/");
    cy.window().its("scrollY").should("eq", 0);
    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
  });

  it("keeps guest users in the app shell when returning from compare to history", () => {
    cy.visit("/guest");

    cy.location("pathname").should("eq", "/");
    cy.findByRole("tab", { name: "Compare" }).click();
    cy.location("pathname", { timeout: 10000 }).should("eq", "/rate/compare");

    cy.findByRole("tab", { name: "History" }).click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/");
    cy.findByRole("heading", { name: "Check the Rate" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the rate before money moves." }).should("not.exist");
  });

  it("renders the home shell without redirecting to login", () => {
    cy.visit(defaultAppUrl);

    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the Rate" }).should("be.visible");
    cy.findByRole("textbox", { name: "Email" }).should("not.exist");
  });

  it("renders exchange-rate data details from Frankfurter currencies", () => {
    cy.fixture<CurrenciesFixture>("frankfurter-currencies.json").then((currencies) => {
      const currencyCount = currencies.length;

      cy.visit(defaultAppUrl);

      cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
      cy.findByRole("list", { name: "Exchange rate data stats" }).within(() => {
        cy.contains(`${currencyCount} Currencies`).should("be.visible");
        cy.contains("EOD").should("be.visible");
        cy.contains("Central bank data").should("be.visible");
        cy.findAllByRole("listitem").should("have.length", 3);
      });
      cy.contains("1 USD = 0.8540 EUR").should("be.visible");
    });
  });

  it("keeps range picker focus while range data refreshes", () => {
    cy.visit(defaultAppUrl);

    cy.findByRole("radio", { name: "1M" }).focus().should("be.focused");
    cy.press(Cypress.Keyboard.Keys.RIGHT);

    cy.findByRole("radio", { name: "3M" })
      .should("be.focused")
      .and("have.attr", "aria-checked", "true");
    cy.location("search").should("include", "range=3M");
  });

  it("supports the complete currency-picker keyboard flow", () => {
    cy.visit(defaultAppUrl);

    openSendCurrencyPickerWithKeyboard();
    cy.findByRole("searchbox", { name: "Search currencies" }).type("jpy{enter}");

    cy.findByRole("dialog", { name: "Currency picker" }).should("not.exist");
    cy.findByRole("button", { name: "JPY" }).should("be.focused").and("contain.text", "JPY");

    openSendCurrencyPickerWithKeyboard("JPY");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.findByRole("button", { name: "JPY, Japanese Yen" }).should("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.findByRole("searchbox", { name: "Search currencies" }).should("be.focused");
    cy.press(Cypress.Keyboard.Keys.UP);
    cy.findByRole("button", { name: "ZAR, South African Rand" }).should("be.focused");
    cy.get('[data-test-id="currency-results"]').should(($results) => {
      expect($results[0]?.scrollTop).to.be.greaterThan(0);
    });

    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.findByRole("button", { name: "JPY" }).click();
    cy.findByRole("group", { name: "Send" })
      .findByRole("textbox", { name: "Amount" })
      .click()
      .should("be.focused");
    cy.findByRole("dialog", { name: "Currency picker" }).should("not.exist");
  });

  it("supports keyboard navigation after focus enters the picker with a mouse", () => {
    cy.visit(defaultAppUrl);

    cy.findByRole("button", { name: "USD" }).click();
    cy.findByRole("group", { name: "Send" }).click();
    cy.findByRole("group", { name: "Send" }).click();

    cy.findByRole("button", { name: "USD" }).click();
    cy.findByRole("searchbox", { name: "Search currencies" }).should("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.findByRole("button", { name: "USD, United States Dollar" })
      .should("be.focused")
      .and(($currency) => {
        expect(getComputedStyle($currency[0]!).boxShadow).not.to.equal("none");
      });

    cy.press(Cypress.Keyboard.Keys.DOWN);
    cy.findByRole("button", { name: "EUR, Euro" }).should("be.focused");
  });

  it("resizes the mobile currency picker to the space below its trigger", () => {
    cy.viewport(375, 667);
    cy.visit(defaultAppUrl);

    cy.findByRole("button", { name: "USD", timeout: 10000 }).then(($trigger) => {
      cy.wrap($trigger).click({ scrollBehavior: false });
      cy.findByRole("dialog", { name: "Currency picker" }).should(($dialog) => {
        const triggerBottom = $trigger[0]!.getBoundingClientRect().bottom;
        const dialogRect = $dialog[0]!.getBoundingClientRect();
        const viewportHeight = $dialog[0]!.ownerDocument.defaultView!.innerHeight;

        expect(dialogRect.top).to.be.greaterThan(triggerBottom);
        expect(dialogRect.bottom).to.be.at.most(viewportHeight - 16);
        expect(dialogRect.height).to.be.lessThan(458);
      });
      cy.findByRole("button", { name: "EUR" }).then(($receiveTrigger) => {
        cy.findByRole("dialog", { name: "Currency picker" }).should(($dialog) => {
          const receiveRect = $receiveTrigger[0]!.getBoundingClientRect();
          const topmostElement = $dialog[0]!.ownerDocument.elementFromPoint(
            receiveRect.left + receiveRect.width / 2,
            receiveRect.top + receiveRect.height / 2
          );

          expect($dialog[0]!.contains(topmostElement)).to.equal(true);
        });
      });
    });
  });
});
