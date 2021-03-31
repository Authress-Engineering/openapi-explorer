import { css } from 'lit-element';

export default css`
*.api-request, *.api-request:before, *.api-request:after, .api-request *, .api-request *:before, .api-request *:after { box-sizing: border-box; }

.api-request.focused-mode,
.api-request.read-mode {
  padding-top:24px;
  margin-top:12px;
  border-top: 1px dashed var(--border-color);
}
.api-request .param-name,
.api-request .param-type {
  margin: 1px 0;
  text-align: right;
  line-height: var(--font-size-small);
}
.api-request .param-name {
  color: var(--fg); 
  font-family: var(--font-mono);
}
.api-request .param-type {
  color: var(--light-fg); 
  font-family: var(--font-regular);
}
.api-request .param-constraint {
  min-width:100px;
}
.api-request .param-constraint:empty {
  display:none;
}
.api-request .top-gap{margin-top:24px;}

.api-request .textarea {
  min-height:220px; 
  padding:5px;
  resize:vertical;
}
.api-request .example:first-child {
  margin-top: -9px;
}

.api-request .response-message{
  font-weight:bold;
  text-overflow: ellipsis;
}
.api-request .response-message.error {
  color:var(--red);
}
.api-request .response-message.success {
  color:var(--blue);
}

.api-request .file-input-container {
  align-items:flex-end;
}
.api-request .file-input-container .input-set:first-child .file-input-remove-btn{
  visibility:hidden;
}

.api-request .file-input-remove-btn{
  font-size:16px;
  color:var(--red);
  outline: none;
  border: none;
  background:none;
  cursor:pointer;
}

.api-request .v-tab-btn {
  font-size: var(--smal-font-size);
  height:24px; 
  border:none; 
  background:none; 
  opacity: 0.3;
  cursor: pointer;
  padding: 4px 8px;
}
.api-request .v-tab-btn.active {
  font-weight: bold;
  background: var(--bg);
  opacity: 1;
}

.api-request .border-top {
  border-top:1px solid var(--border-color);
}
.api-request .border{
  border:1px solid var(--border-color);
  border-radius: var(--border-radius);
}
.api-request .light-border{
  border:1px solid var(--light-border-color);
  border-radius: var(--border-radius);
}
.api-request .pad-8-16{
  padding: 8px 16px;
}
.api-request .pad-top-8{
  padding-top: 8px;
}
.api-request .mar-top-8{
  margin-top: 8px;
}

@media only screen and (min-width: 768px) {
  .api-request .textarea {
    padding:8px;
  }
}
`;
