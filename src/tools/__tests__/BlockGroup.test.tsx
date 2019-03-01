import React from 'react';
import { mount } from 'enzyme';
let BlockGroup: any;
switch (process.env.LIB_DIR) {
  case 'dist':
    BlockGroup = require('../../../dist/lib/BlockGroup').default;
    break;
  case 'lib':
    BlockGroup = require('../../../lib/BlockGroup').default;
    break;
  default:
    BlockGroup = require('../BlockGroup').default;
    break;
}
import Listener from '../../utils/GlobalListener';
import 'nino-cli/scripts/setup';

describe('BlockGroup', () => {
  beforeEach(() => {
    (window as any).DataCollector = new Listener();
  });

  afterEach(() => {
    (window as any).DataCollector = null;
  });

  it("when lineData is null, onChange shouldn't be called", () => {
    const onChange = jest.fn();
    mount(
      <BlockGroup
        data={{
          'block-442566': {
            x: 571,
            y: 320,
            style: {
              width: 100,
              height: 80,
            },
          },
        }}
        lineData={undefined}
        onChange={onChange}
      />,
    );
    expect(onChange).not.toBeCalled();
  });
});