import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import Draggable from 'react-draggable';
import { isSameCoordinate } from '../utils/commonUtil';
import { generateKey, stopPropagation } from '../utils/LineUtil';
import omit from 'omit.js';
import './assets/BlockGroup.css';

// one Line is mapping to two Block
// to record it here
let mapping = {};
// to save refs
let blockDOM = {};
// to save the key of currently dragging Block
let currentBlock = '';
const keysLength = (obj: object) => Object.keys(obj).length;

const addBlockDom = (lineData: any, blockDOM: any) => {
  for (let key in lineData) {
    const { fromKey, toKey } = lineData[key];

    for (let blockKey in blockDOM) {
      const value = blockDOM[blockKey];

      if (fromKey == blockKey) {
        lineData[key].from = value;
      }

      if (toKey == blockKey) {
        lineData[key].to = value;
      }
    }
  }
  return lineData;
};

export interface BlockGroupProps {
  className?: string;
  data?: any;
  lineData?: any;
  onChange?: (data: any, lineData?: any) => void;
}
export interface BlockGroupState {
  data?: any;
  lineData?: any;
}

export default class BlockGroup extends Component<
  BlockGroupProps,
  BlockGroupState
> {
  private checkBlockClickList: any;

  constructor(props: BlockGroupProps) {
    super(props);

    this.state = {
      data: {},
      lineData: {},
    };

    // for Line, two point create a line
    this.checkBlockClickList = {};
  }

  static getDerivedStateFromProps(
    nextProps: BlockGroupProps,
    nextState: BlockGroupState,
  ) {
    mapping = Object.assign({}, mapping, nextProps.lineData);

    if (isSameCoordinate(nextProps, nextState, currentBlock)) {
      return { lineData: nextProps.lineData };
    }

    return {
      data: nextProps.data,
      lineData: nextProps.lineData,
    };
  }

  componentDidUpdate = (prevProps: BlockGroupProps) => {
    const { lineData, onChange, data } = this.props;
    const firstLine: any = Object.values(lineData)[0];
    const hasNewLine = keysLength(lineData) != keysLength(prevProps.lineData);

    if (!(firstLine && firstLine.from)) {
      if (hasNewLine || keysLength(lineData) != 0) {
        onChange && onChange(data, addBlockDom(lineData, blockDOM));
      }
    }
  };

  handleStop = ({ x, y }: { x: number; y: number }, blockKey: string) => {
    const { data, onChange, lineData } = this.props;

    data[blockKey] = Object.assign({}, data[blockKey], { x, y });
    const result = addBlockDom(lineData, blockDOM);

    onChange && onChange(data, result);
  };

  // when Block clicked twice, generate a Line
  // and clear checkBlockClickList
  handleBlockClick = (blockKey: string) => {
    let { checkBlockClickList } = this;
    let { onChange } = this.props;
    const { lineData, data } = this.state;
    const lineKey = generateKey('line');

    checkBlockClickList[blockKey] = { current: blockDOM[blockKey] };

    // to know which Block is starting point
    if (!('time' in checkBlockClickList[blockKey])) {
      checkBlockClickList[blockKey].time = new Date().getTime();
    }

    if (keysLength(checkBlockClickList) == 2) {
      if (!this.shouldPaintLine(checkBlockClickList, lineData)) {
        this.checkBlockClickList = {};
        return;
      }

      const { result, fromKey, toKey } = this.generateLineData(
        lineData,
        lineKey,
      );

      onChange && onChange(data, result);

      this.checkBlockClickList = {};
      // record mapping for arrow
      mapping[lineKey] = {
        fromKey,
        toKey,
      };
    }
  };

  generateLineData = (lineData: any, lineKey: string) => {
    const { checkBlockClickList } = this;
    let fromNode, toNode, fromKey, toKey;
    const keys = Object.keys(checkBlockClickList);

    if (checkBlockClickList[keys[0]] > checkBlockClickList[keys[1]]) {
      fromKey = keys[1];
      toKey = keys[0];
    } else {
      fromKey = keys[0];
      toKey = keys[1];
    }

    fromNode = checkBlockClickList[fromKey].current;
    toNode = checkBlockClickList[toKey].current;

    const common = {
      fromKey,
      toKey,
    };
    lineData[lineKey] = {
      ...common,
      from: fromNode,
      to: toNode,
    };

    return {
      result: lineData,
      ...common,
    };
  };

  saveBlock = (ref: HTMLDivElement | null, blockKey: string) => {
    blockDOM[blockKey] = ReactDOM.findDOMNode(ref);
  };

  shouldPaintLine = (checkBlockClickList: any, linesProps: any) => {
    if (!keysLength(linesProps)) {
      return true;
    }

    const blocks = Object.keys(checkBlockClickList).toString();
    for (let key of Object.keys(mapping)) {
      let fromFlag = false,
        toFlag = false;
      const { fromKey, toKey } = mapping[key];

      if (blocks.includes(fromKey)) {
        fromFlag = true;
      }

      if (blocks.includes(toKey)) {
        toFlag = true;
      }

      if (fromFlag && toFlag) {
        return false;
      }
    }

    return true;
  };

  handleDragStart = (e: any) => {
    stopPropagation(e);
  };

  handleDrag = (blockKey: string) => {
    const { onChange } = this.props;
    currentBlock = blockKey;
    onChange && onChange(this.state.data);
  };

  render() {
    const { className, onChange, ...rest } = this.props;
    const { data } = this.state;

    (window as any).DataCollector.set('BlockGroup', data);
    return Object.keys(data).map(blockKey => {
      const { x, y, style } = data[blockKey];
      return (
        <Draggable
          onStop={(e, item) => this.handleStop(item, blockKey)}
          key={blockKey}
          position={{ x, y }}
          onDrag={e => this.handleDrag(blockKey)}
          onStart={this.handleDragStart}
        >
          <div
            className={classNames('BlockGroup', 'animate-appear', className)}
            onClick={e => this.handleBlockClick(blockKey)}
            ref={ref => this.saveBlock(ref, blockKey)}
            style={style}
            {...omit(rest, ['lineData'])}
          />
        </Draggable>
      );
    });
  }
}