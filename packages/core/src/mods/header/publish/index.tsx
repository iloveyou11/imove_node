import React, { useState } from 'react';
import { Button, Select, Modal } from 'antd';
import { Graph } from '@antv/x6';
import axios from 'axios';
import styles from './index.module.less';
const { Option } = Select;

interface IProps {
  flowChart: Graph;
}

const Publish: React.FC<IProps> = (props) => {
  const { flowChart } = props;
  const DEFAULT_ENV = 'daily';
  const [env, setEnv] = useState<string>(DEFAULT_ENV);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const handlePublish = async (env: string) => {
    const data = flowChart.toJSON();
    const nodeFns: any = {};
    const cells = data.cells;
    cells.forEach((cell: any) => {
      if (cell.shape !== 'edge') {
        nodeFns[cell.id] = cell.data?.processCode || '';
      }
    });
    const res: any = await axios.post(`/web/api/admin/dynamic/publish/${env}`, {
      nodeFns,
      dsl: cells,
    });
    if (res.success) {
      console.log('编排内容发布成功！');
    } else {
      console.log('编排内容发布失败，请重试！');
    }
  };

  const handleChangeEnv = (value: string) => {
    setEnv(value);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    handlePublish(env);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Button
        className={styles.container}
        type={'primary'}
        size={'small'}
        onClick={showModal}
      >
        发布
      </Button>
      <Modal
        title="选择环境"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Select
          defaultValue={DEFAULT_ENV}
          style={{ width: '100%' }}
          onChange={handleChangeEnv}
        >
          <Option value="daily">日常</Option>
          <Option value="pre">预发</Option>
          <Option value="prod">生产</Option>
        </Select>
      </Modal>
    </>
  );
};

export default Publish;
