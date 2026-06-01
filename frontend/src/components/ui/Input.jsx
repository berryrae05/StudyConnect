import "./Input.css";

export default function Input({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    hint,
    error,
    suffix,
    disabled,
    required,
}) {
    return (
        <div className="input-container">
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}

            <div className={`input-row ${error ? "input-row--error" : ""} ${disabled ? "input-row--disabled" : ""}`}>

                <input
                    className="input-field"
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    aria-invalid={!!error}
                    aria-describedby={error ? "input-error" : hint ? "input-hint" : undefined}
                />

                {suffix && (
                    <span className="input-suffix">{suffix}</span>
                )}
            </div>

            {/* Display error message if there is an error, otherwise display hint if it exists */}
            {error && (
                <p className="input-error" id="input-error" role="alert">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {error}
                </p>
            )}

            {/* Only show hint if there is no error */}
            {hint && !error && (
                <p className="input-hint" id="input-hint">
                    {hint}
                </p>
            )}
        </div>
    );
}