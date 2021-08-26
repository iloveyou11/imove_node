export default `import Logic from './logic';
import { provide, scope, ScopeEnum, init, inject } from '@ali/midway';

@scope(ScopeEnum.Singleton)
@provide()
export class LogicManager {
  private logic: Logic;

  @inject('imoveOssManager')
  private imoveOssManager: any;

  @init()
  public async init() {
    const config = await this.imoveOssManager.read('/admin/config.json');
    const {dsl, nodeFns} = JSON.parse(config);
    this.logic = new Logic({dsl, nodeFns});
  }

  public async update(config) {
    return this.logic.updateConfig(config);
  }

  public async invoke(code, params) {
    return this.logic.invoke(code, params);
  }
}
`;
