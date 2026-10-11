import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateAcademyForm } from "@/features/academy";
import {
  AcceptInvitationView,
  BareHostLoginView,
  SignInView,
} from "@/features/auth";
import { PublicLanding } from "@/features/marketing";

describe("auth UI", () => {
  it("keeps public landing focused on academy creation with marketing CTAs", () => {
    const html = renderToStaticMarkup(<PublicLanding />);

    expect(html).toContain("AI-native LMS for branded academies");
    expect(html).toContain("Create your academy");
    expect(html).toContain('href="/get-started"');
    expect(html).not.toContain('href="/login"');
    expect(html).toContain('href="/join"');
    expect(html).toContain("Course-grounded AI");
    expect(html).not.toContain("Create Organization");
    expect(html).not.toContain("Accept Invitation");
    expect(html).not.toContain("organization");
    expect(html).not.toContain("tenant");
  });

  it("renders separate login, academy creation, and invitation surfaces", () => {
    const signInHtml = renderToStaticMarkup(<SignInView />);
    expect(signInHtml).toContain("To continue your academy");
    expect(signInHtml).toContain("Email Address");
    expect(signInHtml).toContain('placeholder="Enter email"');
    expect(signInHtml).toContain('aria-label="Show password"');
    expect(signInHtml).toContain('href="/forgot-password"');
    expect(signInHtml).toContain("disabled");
    expect(signInHtml).not.toContain("Join an existing one");
    expect(signInHtml).not.toContain("Create an academy");
    expect(signInHtml).toContain("login-img.png");
    expect(renderToStaticMarkup(<SignInView academyName="Eap Academy" />)).toContain(
      "Sign in to Eap Academy",
    );
    expect(renderToStaticMarkup(<SignInView />)).not.toContain("This field is required.");
    expect(renderToStaticMarkup(<SignInView />)).not.toContain("Enter your email address.");
    expect(renderToStaticMarkup(<SignInView />)).not.toContain("Enter your password.");
    const bareHostHtml = renderToStaticMarkup(<BareHostLoginView />);
    expect(bareHostHtml).toContain("Open your academy");
    expect(bareHostHtml).toContain("your-academy.localhost:3001/login");
    expect(bareHostHtml).toContain('href="/get-started"');
    expect(bareHostHtml).toContain('href="/join"');
    expect(bareHostHtml).not.toContain("Password");
    const createAcademyHtml = renderToStaticMarkup(
      <CreateAcademyForm
        action={async () => ({ accessToken: "token", subdomain: "acme" })}
        onSuccess={() => {}}
      />,
    );
    expect(createAcademyHtml).toContain("Set up your academy space.");
    expect(createAcademyHtml).toContain("STEP 1 OF 2");
    expect(createAcademyHtml).toContain("First Name");
    expect(createAcademyHtml).toContain("Last Name");
    expect(createAcademyHtml).toContain("Phone");
    expect(createAcademyHtml).toContain("At least 12 characters");
    expect(createAcademyHtml).toContain("Upper &amp; lowercase letters");
    expect(createAcademyHtml).toContain("A number or symbol");
    expect(createAcademyHtml).toContain("Password strength: weak");
    expect(createAcademyHtml).toContain("Continue");
    expect(createAcademyHtml).toContain("noValidate");
    const academyStepHtml = renderToStaticMarkup(
      <CreateAcademyForm
        action={async () => ({ accessToken: "token", subdomain: "acme" })}
        initialStep={2}
        onSuccess={() => {}}
      />,
    );
    expect(academyStepHtml).toContain("STEP 2 OF 2");
    expect(academyStepHtml).toContain("Academy Name");
    expect(academyStepHtml).toContain(".omnixtra.app");
    expect(academyStepHtml).toContain('href="/terms"');
    expect(academyStepHtml).toContain('href="/privacy"');
    expect(academyStepHtml).toContain("disabled");
    expect(academyStepHtml).toContain("Create Academy");
    expect(
      renderToStaticMarkup(
        <AcceptInvitationView
          preview={{
            organization_name: "Acme Learning",
            email: "learner@example.com",
            first_name: "Learner",
            last_name: "Example",
          }}
          token={"invite_token_123"}
        />,
      ),
    ).toContain("learner@example.com");
    expect(renderToStaticMarkup(<AcceptInvitationView preview={null} token={null} />)).toContain(
      "Join an academy",
    );
    expect(
      renderToStaticMarkup(<AcceptInvitationView preview={null} token={"invite_token_123"} />),
    ).toContain("This link is no longer valid");
  });
});
