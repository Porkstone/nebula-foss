import { Link } from 'react-router-dom';
import { licensePolicyMessage } from '../convex/lib/policy';

export function SubmissionError({message}: {message: string}) {
  return <div className="error" role="alert">
    {message === licensePolicyMessage
      ? <>This repository could not be published because it does not have a recognised licence from Nebula’s permitted list. We recommend MIT. <Link className="inline-link" to="/licences" target="_blank" rel="noopener noreferrer">View permitted licences</Link>.</>
      : message}
  </div>;
}
