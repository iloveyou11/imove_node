export default `import Logic from './logic';
import config from './config';
// import plugins here

const logic = new Logic({ dsl: config.dsl });

// use plugins here

export default logic;
`;
