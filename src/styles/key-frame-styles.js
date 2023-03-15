import { css } from 'lit';

export default css`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 
    Expand a block smoothly to 100px, then to fill the current viewport.
    Unlike with a transition, the final CSS can have an unbounded height, which will take effect after the animation.
    Simultaneously fades in, mostly for symmetry with the collapse animation below.
  */
  @keyframes expand-height {
    0% { max-height: 0; opacity: 0; }
    50% { max-height: 100px; opacity: 100%; }
    100% { max-height: 100lvh; }
  }
  /*
    Rough inverse of the above - animate from a maximum of full viewport height down to zero.
    Since most elements will already be smaller than the viewport, most of the animation time is spent on the last 100px.
    Simultaneously fades the content out, so that some visible animation starts immediately even for very short elements. 
   */
  @keyframes collapse-height {
    0% { max-height: 500lvh; opacity: 100%; }
    5% { max-height: 50lvh; }
    40% { max-height: 100px; opacity: 25%; }
    100% { max-height: 0; opacity: 0; }
  }
`;
