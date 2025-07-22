import React, { useState } from "react";
import "./ApplyForm.css";

/**
 * Application form component for students to apply for opportunities.
 * @param {Object} props - Component props
 * @param {Object} props.opportunity - The opportunity being applied for
 * @param {Function} props.onClose - Function to close the form
 * @param {Function} props.onSubmit - Function to handle form submission
 * @returns {JSX.Element}
 */
function ApplyForm({ opportunity, onClose, onSubmit }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    semester: "",
    cgpa: "",
    experience: "",
    cv: null,
    coverLetter: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errs = {};
    if (!form.firstName) errs.firstName = "First name required";
    if (!form.lastName) errs.lastName = "Last name required";
    if (!form.email) errs.email = "Email required";
    if (!form.phone) errs.phone = "Phone required";
    if (!form.semester) errs.semester = "Semester required";
    if (!form.cgpa) errs.cgpa = "CGPA required";
    if (!form.cv) errs.cv = "CV required";
    if (!form.coverLetter) errs.coverLetter = "Cover letter required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (onSubmit) await onSubmit(form);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      semester: "",
      cgpa: "",
      experience: "",
      cv: null,
      coverLetter: "",
    });
    if (onClose) onClose();
  };

  const handleFileChange = (e) => {
    setForm({ ...form, cv: e.target.files[0] });
  };

  return (
    <div className="apply-form-container">
      <form onSubmit={handleSubmit} className="apply-form">
        <h3 className="apply-form-title">Apply for {opportunity?.title || "Opportunity"}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              className={`form-input ${errors.firstName ? 'error' : ''}`}
            />
            {errors.firstName && <div className="field-error">{errors.firstName}</div>}
          </div>
          
          <div className="form-group">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              className={`form-input ${errors.lastName ? 'error' : ''}`}
            />
            {errors.lastName && <div className="field-error">{errors.lastName}</div>}
          </div>
        </div>

        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className={`form-input ${errors.email ? 'error' : ''}`}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className={`form-input ${errors.phone ? 'error' : ''}`}
          />
          {errors.phone && <div className="field-error">{errors.phone}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="semester"
              placeholder="Semester"
              value={form.semester}
              onChange={e => setForm({ ...form, semester: e.target.value })}
              className={`form-input ${errors.semester ? 'error' : ''}`}
            />
            {errors.semester && <div className="field-error">{errors.semester}</div>}
          </div>
          
          <div className="form-group">
            <input
              type="text"
              name="cgpa"
              placeholder="CGPA"
              value={form.cgpa}
              onChange={e => setForm({ ...form, cgpa: e.target.value })}
              className={`form-input ${errors.cgpa ? 'error' : ''}`}
            />
            {errors.cgpa && <div className="field-error">{errors.cgpa}</div>}
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            name="experience"
            placeholder="Experience (optional)"
            value={form.experience}
            onChange={e => setForm({ ...form, experience: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="file-label">
            <input
              type="file"
              name="cv"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="file-input"
            />
            <span className="file-label-text">
              {form.cv ? form.cv.name : 'Upload CV (PDF, DOC, DOCX)'}
            </span>
          </label>
          {errors.cv && <div className="field-error">{errors.cv}</div>}
        </div>

        <div className="form-group">
          <textarea
            name="coverLetter"
            placeholder="Cover Letter"
            value={form.coverLetter}
            onChange={e => setForm({ ...form, coverLetter: e.target.value })}
            className={`form-textarea ${errors.coverLetter ? 'error' : ''}`}
            rows="4"
          />
          {errors.coverLetter && <div className="field-error">{errors.coverLetter}</div>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">Submit Application</button>
          <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default ApplyForm;
