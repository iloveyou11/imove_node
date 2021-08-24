import React, { useState, useEffect } from 'react';
import styles from './index.module.less';
import { Card, Select, Switch } from 'antd';
import { Cell, Graph } from '@antv/x6';
import Json from '../../components/json';
import Input from '../../components/input';
import CodeEditor from '../../../../components/codeEditor';

const { Option } = Select;

interface IProps {
  selectedCell: Cell;
  flowChart: Graph;
}

interface IBasicData {
  label: string;
  trigger?: string;
  dependencies: string;
  configSchema: string;
  inputMode: string;
  outputMode: string;
  processCode: string;
  loop: boolean;
}

const Basic: React.FC<IProps> = (props) => {
  const { selectedCell, flowChart } = props;
  const [data, setData] = useState<IBasicData>(selectedCell.getData());
  const {
    label,
    trigger,
    dependencies,
    inputMode,
    outputMode,
    processCode,
    loop,
  } = data || {};

  // life
  useEffect(() => {
    setData(selectedCell.getData());
  }, [selectedCell]);
  useEffect(() => {
    const handler = () => setData(selectedCell.getData());
    flowChart.on('settingBar.basicPanel:forceUpdate', handler);
    return () => {
      flowChart.off('settingBar.basicPanel:forceUpdate', handler);
    };
  }, [selectedCell]);

  // events
  const batchUpdate = (newData: { [key: string]: any }): void => {
    selectedCell.setData(newData);
    setData(Object.assign({}, data, newData));
  };
  const commonChange = (key: string, val: string | boolean): void => {
    batchUpdate({ [key]: val });
  };
  const onChangeLabel = (val: string): void => {
    commonChange('label', val);
    selectedCell.setAttrs({ label: { text: val } });
  };
  const onChangeTrigger = (val: string): void => {
    commonChange('trigger', val);
  };
  const onChangeLoop = (val: boolean): void => {
    commonChange('loop', val);
  };
  const onChangeDependencies = (val: string): void => {
    commonChange('dependencies', val);
  };
  const onChangeInputMode = (val: string): void => {
    commonChange('inputMode', val);
  };
  const onChangeOutputMode = (val: string): void => {
    commonChange('outputMode', val);
  };
  const onChangeCode = (ev: any, val: string | undefined = ''): void => {
    commonChange('processCode', val);
  };

  return (
    <div className={styles.container}>
      <Card title="节点显示名称">
        <Input
          name={'label'}
          title={''}
          value={label}
          onValueChange={onChangeLabel}
        />
        {selectedCell.shape === 'imove-start' && (
          <div className={styles.input}>
            <Input
              name={'trigger'}
              title={'流程触发CODE'}
              value={trigger}
              onValueChange={onChangeTrigger}
            />
          </div>
        )}
      </Card>
      {selectedCell.shape === 'imove-start' && (
        <Card title="是否是循环流程">
          <Switch checked={loop} onChange={onChangeLoop} />
        </Card>
      )}
      <Card title="入参模式">
        <Select
          className={styles.select}
          defaultValue={inputMode}
          onChange={onChangeInputMode}
        >
          <Option value="default">依赖上一节点出参</Option>
          <Option value="api">依赖接口入参</Option>
          <Option value="normal">普通模式</Option>
        </Select>
      </Card>
      <Card title="结果处理模式">
        <Select
          className={styles.select}
          defaultValue={outputMode}
          onChange={onChangeOutputMode}
        >
          <Option value="nopack">无</Option>
          <Option value="pack">拆包</Option>
        </Select>
      </Card>
      <Json
        name={'dependencies'}
        title={'npm依赖包'}
        value={dependencies}
        isConfig={false}
        onValueChange={onChangeDependencies}
      />
      <h3 style={{ margin: 20 }}>入参预处理</h3>
      <CodeEditor
        value={processCode}
        width={'100%'}
        height={'200px'}
        onChange={onChangeCode}
      />
    </div>
  );
};

export default Basic;
