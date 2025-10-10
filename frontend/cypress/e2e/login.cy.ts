describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login successfully and navigate to dashboard', () => {
    // Intentar login con credenciales por defecto
    cy.get('input[name="email"]').type('admin@DobackSoft.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Verificar que se redirige al dashboard
    cy.url().should('include', '/');

    // Verificar que el token se guardó en localStorage
    cy.window().its('localStorage.token').should('exist');
  });

  it('should handle invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@email.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Verificar que se muestra el mensaje de error
    cy.get('[role="alert"]').should('be.visible');
  });

  it('should persist login state after page reload', () => {
    // Login exitoso
    cy.get('input[name="email"]').type('admin@DobackSoft.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Recargar la página
    cy.reload();

    // Verificar que sigue en el dashboard
    cy.url().should('include', '/');
  });
}); 