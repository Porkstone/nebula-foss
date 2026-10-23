import { ConvexError } from 'convex/values';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import { licensePolicyMessage } from '../convex/lib/policy';
import { errorText } from './errorText';
import { SubmissionError } from './SubmissionError';

const productionMessage = '[CONVEX A(github:submit)] [Request ID: 2fc5f49491cbc9ac] Server Error Called by client';
const renderError = (error: unknown) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SubmissionError, {message: errorText(error)})));

test('a production licence rejection shows the explanation and policy link instead of the redacted server error', () => {
  const error = new ConvexError(licensePolicyMessage);
  error.message = productionMessage;
  const html = renderError(error);
  expect(html).toContain('role="alert"');
  expect(html).toContain('does not have a recognised licence');
  expect(html).toContain('We recommend MIT');
  expect(html).toContain('href="/licences"');
  expect(html).toContain('View permitted licences');
  expect(html).not.toContain('Server Error');
});

test('structured rate-limit errors retain their message and retry data without being labelled a licence rejection', () => {
  const error = new ConvexError({message: 'GitHub has temporarily paused repository checks. Please try again in 4 minutes.', retryAt: 123456});
  error.message = productionMessage;
  const html = renderError(error);
  expect(html).toContain('Please try again in 4 minutes.');
  expect(html).not.toContain('href="/licences"');
  expect(error.data.retryAt).toBe(123456);
});

test('unknown failures use a retry message without inventing a licence rejection', () => {
  expect(renderError(null)).toContain('Something went wrong. Please try again.');
  expect(renderError(null)).not.toContain('href="/licences"');
});
