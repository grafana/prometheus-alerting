import React from 'react';
import { useParams } from 'react-router-dom';

// TODO: Test if React Router v6 correctly handles encoded hash parameters
// Previous versions had issues with encoding - see: https://github.com/remix-run/history/issues/505

function RuleEditor() {
  const { hash } = useParams<{ hash?: string }>();

  return (
    <div>
      <h1>{hash ? 'Edit Rule' : 'Create New Rule'}</h1>
      {hash && <p>Hash: {hash}</p>}
      <p>This is a placeholder for the rule editor.</p>
    </div>
  );
}

export default RuleEditor;
