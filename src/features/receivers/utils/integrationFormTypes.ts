type DeclaredObjectFields<Value extends object> = {
  [Key in keyof Value as string extends Key ? never : number extends Key ? never : Key]: ReceiverFormFields<Value[Key]>;
};

/**
 * Removes the catch-all index signatures inferred by Zod loose objects while retaining declared
 * properties, nested arrays, and intentional string/number records.
 */
type ReceiverFormFields<Value> =
  Value extends ReadonlyArray<infer Item>
    ? Array<ReceiverFormFields<Item>>
    : Value extends object
      ? keyof DeclaredObjectFields<Value> extends never
        ? Value
        : DeclaredObjectFields<Value>
      : Value;

/**
 * Narrows a receiver integration component to the declared fields in its own settings schema. The
 * API-facing schemas remain loose and preserve unknown fields; only the receiver form's local
 * react-hook-form view excludes their catch-all index signatures.
 */
export type IntegrationFormValues<Settings> = {
  integrations: Array<{ settings: ReceiverFormFields<Settings> }>;
};
