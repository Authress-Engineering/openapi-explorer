import { css } from 'lit';

export default css`
.only-large-screen { display:none; }
.endpoint-head .path{
  display: flex;
  font-family:var(--font-mono);
  font-size: var(--font-size-small);
  align-items: center;
  flex-wrap: wrap;
}

.endpoint-head .descr {
  font-size: var(--font-size-small);
  color:var(--light-fg);
  font-weight:400;
  align-items: center;
  overflow-wrap: break-word;
  word-break: break-all;
  display:none;
}

.m-endpoint.expanded{margin-bottom:16px; }
.m-endpoint > .endpoint-head{
  border-width:1px 1px 1px 5px;
  border-style:solid;
  border-color:transparent;
  border-top-color:var(--light-border-color);
  display:flex;
  padding:6px 16px;
  align-items: center;
  cursor: pointer;
}
.m-endpoint > .endpoint-head.put:hover,
.m-endpoint > .endpoint-head.put.expanded{
  border-color: var(--orange); 
  background-color: var(--light-orange);
}
.m-endpoint > .endpoint-head.post:hover,
.m-endpoint > .endpoint-head.post.expanded {
  border-color:var(--green); 
  background-color: var(--light-green);
}
.m-endpoint > .endpoint-head.get:hover,
.m-endpoint > .endpoint-head.get.expanded,
.m-endpoint > .endpoint-head.head:hover,
.m-endpoint > .endpoint-head.head.expanded {
  border-color:var(--blue); 
  background-color: var(--light-blue);
}
.m-endpoint > .endpoint-head.delete:hover,
.m-endpoint > .endpoint-head.delete.expanded {
  border-color:var(--red); 
  background-color: var(--light-red);
}

.m-endpoint > .endpoint-head.patch:hover,
.m-endpoint > .endpoint-head.patch.expanded {
  border-color :var(--yellow); 
  background-color: var(--light-yellow);
}
.m-endpoint > .endpoint-head.query:hover,
.m-endpoint > .endpoint-head.query.expanded {
  border-color: var(--purple);
  background-color: var(--light-purple);
}
.m-endpoint > .endpoint-head.options:hover,
.m-endpoint > .endpoint-head.options.expanded {
  border-color: var(--gray);
  background-color: var(--light-gray);
}

.m-endpoint .endpoint-body {
  word-break: break-word;
  flex-wrap:wrap;
  padding: 16px 0 0 0;
  border-width:0px 1px 1px 5px;
  border-style:solid;
  box-shadow: 0px 4px 3px -3px rgba(0, 0, 0, 0.15);
}
.m-endpoint .endpoint-body.delete{ border-color:var(--red); }
.m-endpoint .endpoint-body.put{ border-color:var(--orange); }
.m-endpoint .endpoint-body.post{border-color:var(--green);}
.m-endpoint .endpoint-body.get, .m-endpoint .endpoint-body.head { border-color:var(--blue); }
.m-endpoint .endpoint-body.patch { border-color:var(--yellow); }
.m-endpoint .endpoint-body.query { border-color: var(--purple); }
.m-endpoint .endpoint-body.options { border-color: var(--gray); }

.summary{
  padding:8px 8px;
}
.summary .title{
  font-size:calc(var(--font-size-regular) + 2px);
  margin-bottom: 6px;
  word-break: break-word;
}

.method {
  padding-top: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  vertical-align: middle;
  font-size:var(--font-size-small);
  height: calc(var(--font-size-small) + 16px);
  line-height: calc(var(--font-size-small) + 8px);
  width: 68px;
  flex-shrink: 0;
  border-radius: 2px;
  text-align: center;
  font-weight: bold;
  text-transform:uppercase;
  margin-right:5px;
}
.method.delete{ border: 2px solid var(--red);}
.method.put{ border: 2px solid var(--orange); }
.method.post{ border: 2px solid var(--green); }
.method.head, .method.get { border: 2px solid var(--blue); }
.method.patch { border: 2px solid var(--yellow); }
.method.query { border: 2px solid var(--purple); }
.method.options { border: 2px solid var(--gray); }

.req-resp-container{
  display: flex;
  margin-top:16px;
  align-items: stretch;
  flex-wrap: wrap;
  flex-direction: column;
}
.view-request {
  flex:1; 
  min-height:100px;
  max-width: 100%;
  padding:16px 8px;
  overflow:hidden;
  border-width: 0px;
  border-style:dashed;
}

.request, .response {
  flex:1; 
  min-height:100px;
  max-width: 100%;
  padding:16px 8px;
  overflow:hidden;
}
.request{
  border-width:0 0 1px 0;
  border-style:dashed;
}
.patch .request {
  border-top: 1px dashed var(--yellow);
  border-color:var(--yellow);
}
.query .request { 
  border-top: 1px dashed var(--purple);
  border-color: var(--purple);
}
.options .request { 
  border-top: 1px dashed var(--gray);
  border-color: var(--gray);
}
.put .request{ 
  border-top: 1px dashed var(--orange);
  border-color:var(--orange);
}
.post .request{ 
  border-top: 1px dashed var(--green);
  border-color:var(--green); 
}
.head .request,
.get .request{ 
  border-top: 1px dashed var(--blue);
  border-color:var(--blue);
}
.delete .request{
  border-top: 1px dashed var(--red);
  border-color:var(--red); 
}

@media only screen and (min-width: 1024px) {
  .only-large-screen { display:block; }
  .endpoint-head .path{
    font-size: var(--font-size-regular);
    min-width:400px;
  }
  .endpoint-head .descr{
    display: flex;
  }
  .endpoint-head .m-markdown-small,
  .descr .m-markdown-small{
    display:block;
  }
  .req-resp-container{
    flex-direction: var(--layout, row);
  }
  .request{
    border-width:0 1px 0 0;
    padding:16px;
  }
  .response{
    padding:16px;
  } 
  .summary{
    padding:8px 16px;
  }
}

.security-info-button {
  position: absolute;
  top: 3px;
  right: 2px;
  font-size: var(--font-size-small);
  line-height: 1.5;
}

@media only screen and (max-width: 768px) {
  .security-info-button {
    display: none;
  }
}

pre.code-sample {
  padding: 8px;
  min-height: 30px;
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
}
`;
