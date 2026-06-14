type CurrenciesFixture = Array<{
  iso_code: string;
  name: string;
}>;

describe("home page", () => {
  beforeEach(() => {
    cy.task("resetFrankfurterMock");
  });

  it("renders a page-level unavailable state when currency data cannot load", () => {
    cy.task("failFrankfurterCurrencies");

    cy.visit("/");

    cy.findByRole("link", { name: "FX Checker" }).should("be.visible");
    cy.findByRole("heading", {
      name: "Exchange rate data is unavailable",
    }).should("be.visible");
    cy.contains("Please refresh the page in a moment.").should("be.visible");
    cy.findByRole("list", { name: "Exchange rate data stats" }).should("not.exist");
  });

  it("renders exchange-rate data details from Frankfurter currencies", () => {
    cy.fixture<CurrenciesFixture>("frankfurter-currencies.json").then((currencies) => {
      const currencyCount = currencies.length;

      cy.visit("/");

      cy.findByRole("link", { name: "FX Checker" }).should("be.visible");
      cy.findByRole("list", { name: "Exchange rate data stats" }).within(() => {
        cy.contains(`${currencyCount} Currencies`).should("be.visible");
        cy.contains("EOD").should("be.visible");
        cy.contains("ECB data").should("be.visible");
      });
    });
  });
});
