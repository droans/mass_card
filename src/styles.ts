import { css } from 'lit';

// Styles belonging to the card
// https://lit.dev/docs/components/styles/
export default css`
  ha-card {
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
  }
  .main {
    display: flex;
    height: 100%;
    margin: auto;
    padding: 6px 16px 6px 16px;
    width: 100%;
    justify-content: space-around;
    overflow-x: scroll;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .name {
    font-weight: 300;
    font-size: var(--fontSize);
    line-height: var(--fontSize);
    cursor: pointer;
  }
  .header {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .title {
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }
  .list {
    height: 400px;
    overflow-y: scroll;
    --mdc-icon-button-size: 1.5rem;
    --mdc-icon-size: 1rem;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  *[selected] {
    color: var(--acent-color)
  }
  *[hide] {
  display: none;
  }
`;
