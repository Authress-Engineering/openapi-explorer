import { css } from 'lit';

export default css`
.m-table {
  border-spacing: 0;  
  border-collapse: separate;
  border: 1px solid var(--light-border-color);
  border-radius: var(--border-radius);
  margin: 0;
  max-width: 100%;
}
.m-table tr:first-child td,
.m-table tr:first-child th {
    border-top: 0 none;
}
.m-table td, 
.m-table th {
  font-size: var(--font-size-small);
  padding: 4px 5px 4px;
}

.m-table td:not([align]), 
.m-table th:not([align]) {
  text-align: left;
}

.m-table th {
  color: var(--fg2);
  font-size: var(--font-size-small);
  line-height: calc(var(--font-size-small) + 18px);
  font-weight: 600;
  letter-spacing: normal;
  background-color: var(--bg2);
  vertical-align: bottom;
  border-bottom: 1px solid var(--light-border-color);
}

.m-table > tbody > tr > td,
.m-table > tr > td {
  border-top: 1px solid var(--light-border-color);
}
.table-title {
  font-size:var(--font-size-small);
  font-weight:bold;
  vertical-align: middle;
  margin: 12px 0 4px 0;
}

.request-form-table {
  border-spacing: 0;  
  border-collapse: separate;
  border: 1px solid var(--light-border-color);
  border-radius: var(--border-radius);
  margin: 0;
  max-width: 100%;
}

.request-form-table td, 
.request-form-table th {
  font-size: var(--font-size-small);
  padding: 4px 5px 4px;
}

.request-form-table td:not([align]), 
.request-form-table th:not([align]) {
  text-align: left;
}

.request-form-table th {
  color: var(--fg2);
  font-size: var(--font-size-small);
  line-height: calc(var(--font-size-small) + 18px);
  font-weight: 600;
  letter-spacing: normal;
  background-color: var(--bg2);
  vertical-align: bottom;
  border-bottom: 1px solid var(--light-border-color);
}

.request-form-table > tr:not(.complex-object-display) + tr:not(.form-parameter-description) > td {
  border-top: 1px solid var(--light-border-color);
}

.request-form-table > tr:not(.complex-object-display) + tr.complex-object-display > td {
  border-top: 1px solid var(--primary-color) !important;
}

.request-form-table .input-set {
  width: 100%;
  margin-top: 2px;
}

.request-form-table .file-input {
  width: 100%;
  margin-top: 2px;
}
`;
