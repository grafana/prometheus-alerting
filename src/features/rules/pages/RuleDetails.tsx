import React from 'react';
import { useParams } from 'react-router-dom';

// TODO: Test if React Router v6 correctly handles encoded hash parameters
// Previous versions had issues with encoding - see: https://github.com/remix-run/history/issues/505

function RuleDetails() {
  const { hash } = useParams<{ hash: string }>();

  return (
    <div>
      <h1>Rule Details</h1>
      <p>Hash: {hash}</p>
      <p>This is a placeholder for the rule details view.</p>
    </div>
  );
}

export default RuleDetails;
