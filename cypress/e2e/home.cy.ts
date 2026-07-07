type CurrenciesFixture = Array<{
  iso_code: string;
  name: string;
}>;

describe("home page", () => {
  beforeEach(() => {
    cy.task("resetFrankfurterMock");
  });

  it("renders the landing page with auth and guest paths", () => {
    cy.visit("/");

    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the rate before money moves." }).should("be.visible");
    cy.findByRole("link", { name: "Log in" }).should("have.attr", "href", "/auth/login");
    cy.findByRole("link", { name: "Get started" }).should("have.attr", "href", "/auth/sign-up");
    cy.findByRole("link", { name: "Try as guest" }).should("have.attr", "href", "/guest");
  });

  it("offers guest mode from sign-up and starts the guest app at the top on mobile", () => {
    cy.viewport(375, 667);
    cy.visit("/auth/sign-up");

    cy.findByRole("button", { name: "Sign up" }).should("be.visible");
    cy.findByRole("link", { name: "Try as guest" }).should("have.attr", "href", "/guest").click();

    cy.location("pathname").should("eq", "/app");
    cy.window().its("scrollY").should("eq", 0);
    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
  });

  it("keeps guest users in the app shell when returning from compare to history", () => {
    cy.visit("/guest");

    cy.location("pathname").should("eq", "/app");
    cy.location("search").should("include", "amount=1000");
    cy.findByRole("tab", { name: "Compare" }).click();
    cy.location("pathname").should("eq", "/rate/compare");

    cy.findByRole("tab", { name: "History" }).click();

    cy.location("pathname").should("eq", "/app");
    cy.findByRole("heading", { name: "Check the Rate" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the rate before money moves." }).should("not.exist");
  });

  it("renders the home shell without redirecting to login", () => {
    cy.visit("/");

    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the rate before money moves." }).should("be.visible");
    cy.findByRole("link", { name: "Log in" }).should("have.attr", "href", "/auth/login");
    cy.findByRole("link", { name: "Get started" }).should("have.attr", "href", "/auth/sign-up");
    cy.findByRole("link", { name: "Try as guest" }).should("have.attr", "href", "/guest");
  });

  it("offers guest mode from sign-up and starts the guest app at the top on mobile", () => {
    cy.viewport(375, 667);
    cy.visit("/auth/sign-up");

    cy.findByRole("button", { name: "Sign up" }).should("be.visible");
    cy.findByRole("link", { name: "Try as guest" }).should("have.attr", "href", "/guest").click();

    cy.location("pathname").should("eq", "/app");
    cy.window().its("scrollY").should("eq", 0);
    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
  });

  it("renders the home shell without redirecting to login", () => {
    cy.visit("/app");

    cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
    cy.findByRole("heading", { name: "Check the Rate" }).should("be.visible");
    cy.findByRole("textbox", { name: "Email" }).should("not.exist");
  });

  it("renders exchange-rate data details from Frankfurter currencies", () => {
    cy.fixture<CurrenciesFixture>("frankfurter-currencies.json").then((currencies) => {
      const currencyCount = currencies.length;

      cy.visit("/app");

      cy.findByRole("img", { name: "FX Checker" }).should("be.visible");
      cy.findByRole("list", { name: "Exchange rate data stats" }).within(() => {
        cy.contains(`${currencyCount} Currencies`).should("be.visible");
        cy.contains("EOD").should("be.visible");
        cy.contains("ECB data").should("be.visible");
      });
      cy.contains("1 USD = 0.8540 EUR").should("be.visible");
    });
  });

  it("supports the complete currency-picker keyboard flow", () => {
    cy.visit("/app");

    cy.findByRole("button", { name: "Select send currency" }).focus();
    cy.press(Cypress.Keyboard.Keys.DOWN);
    cy.findByRole("searchbox", { name: "Search currencies" })
      .should("be.focused")
      .type("jpy{enter}");

    cy.findByRole("dialog", { name: "Currency picker" }).should("not.exist");
    cy.findByRole("button", { name: "Select send currency" })
      .should("be.focused")
      .and("contain.text", "JPY");

    cy.press(Cypress.Keyboard.Keys.DOWN);
    cy.findByRole("searchbox", { name: "Search currencies" }).should("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.findByRole("button", { name: "JPY, Japanese Yen" }).should("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.findByRole("searchbox", { name: "Search currencies" }).should("be.focused");
    cy.press(Cypress.Keyboard.Keys.UP);
    cy.findByRole("button", { name: "ZAR, South African Rand" }).should("be.focused");
    cy.get('[data-test-id="currency-results"').should(($results) => {
      expect($results[0]?.scrollTop).to.be.greaterThan(0);
    });

    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.findByRole("button", { name: "Select send currency" }).click();
    cy.findByRole("textbox", { name: "Send amount" }).click().should("be.focused");
    cy.findByRole("dialog", { name: "Currency picker" }).should("not.exist");
  });

  it("supports keyboard navigation after focus enters the picker with a mouse", () => {
    cy.visit("/app");

    cy.findByRole("button", { name: "Select send currency" }).click();
    cy.findByRole("heading", { name: "Send" }).click();
    cy.findByRole("heading", { name: "Send" }).click();

    cy.findByRole("button", { name: "Select send currency" }).click();
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
    cy.visit("/app");

    cy.findByRole("button", { name: "Select send currency", timeout: 10000 }).then(($trigger) => {
      cy.wrap($trigger).click({ scrollBehavior: false });
      cy.findByRole("dialog", { name: "Currency picker" }).should(($dialog) => {
        const triggerBottom = $trigger[0]!.getBoundingClientRect().bottom;
        const dialogRect = $dialog[0]!.getBoundingClientRect();
        const viewportHeight = $dialog[0]!.ownerDocument.defaultView!.innerHeight;

        expect(dialogRect.top).to.be.greaterThan(triggerBottom);
        expect(dialogRect.bottom).to.be.at.most(viewportHeight - 16);
        expect(dialogRect.height).to.be.lessThan(458);
      });
    });
  });
});
