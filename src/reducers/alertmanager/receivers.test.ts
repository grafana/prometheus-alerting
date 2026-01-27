import {
  initialAlertmanagerConfiguration,
  PostableParsedUserConfiguration,
  PostableParsedUserConfigurationSchema,
} from '@grafana/external-alertmanager/mimir';
import { Receiver } from '@grafana/external-alertmanager/vanilla';

import { addReceiverAction, deleteReceiverAction, receiversReducer, updateReceiverAction } from './receivers';

describe('receivers', () => {
  const initialConfig: PostableParsedUserConfiguration = {
    ...initialAlertmanagerConfiguration,
    template_files: {},
  };

  it('should delete a receiver', () => {
    const config: PostableParsedUserConfiguration = {
      alertmanager_config: {
        ...initialAlertmanagerConfiguration.alertmanager_config,
        receivers: [{ name: 'my receiver' }, { name: 'another receiver' }],
      },
      template_files: {},
    };

    const action = deleteReceiverAction('my receiver');
    const result = receiversReducer(config, action);
    expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
    expect(result).toMatchSnapshot();
  });

  describe('adding receivers', () => {
    it('should be able to add a new Alertmanager receiver', () => {
      const newReceiver: Receiver = {
        name: 'new contact point',
        email_configs: [{ to: 'address@domain.com' }],
      };

      const action = addReceiverAction(newReceiver);
      const result = receiversReducer(initialConfig, action);
      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result).toMatchSnapshot();
    });

    it('should be able to add a new Grafana Alertmanager receiver', () => {
      const newReceiver: Receiver = {
        name: 'another contact point',
        webhook_configs: [{ url: 'https://oncall.example.com' }],
      };

      const action = addReceiverAction(newReceiver);
      const result = receiversReducer(initialConfig, action);
      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result).toMatchSnapshot();
    });

    it('should throw if we add a receiver with duplicate name', () => {
      const config: PostableParsedUserConfiguration = {
        alertmanager_config: {
          ...initialAlertmanagerConfiguration.alertmanager_config,
          receivers: [{ name: 'my receiver' }],
        },
        template_files: {},
      };

      const newReceiver: Receiver = { name: 'my receiver' };
      const action = addReceiverAction(newReceiver);

      expect(() => {
        receiversReducer(config, action);
      }).toThrow(/duplicate receiver/i);
    });
  });

  describe('updating receivers', () => {
    it('should throw if updating a receiver that does not exist', () => {
      const config: PostableParsedUserConfiguration = {
        alertmanager_config: {
          ...initialAlertmanagerConfiguration.alertmanager_config,
          receivers: [{ name: 'my receiver' }],
        },
        template_files: {},
      };

      const updatedReceiver: Receiver = { name: 'my receiver' };
      const action = updateReceiverAction({ name: 'does not exist', receiver: updatedReceiver });

      expect(() => {
        receiversReducer(config, action);
      }).toThrow(/expected receiver .+ to exist/i);
    });

    it('should throw if renaming a receiver to an existing name', () => {
      const config: PostableParsedUserConfiguration = {
        alertmanager_config: {
          ...initialAlertmanagerConfiguration.alertmanager_config,
          receivers: [{ name: 'receiver 1' }, { name: 'receiver 2' }],
        },
        template_files: {},
      };

      const updatedReceiver: Receiver = { name: 'receiver 1' };
      const action = updateReceiverAction({ name: 'receiver 2', receiver: updatedReceiver });

      expect(() => {
        receiversReducer(config, action);
      }).toThrow(/duplicate receiver name/i);
    });

    it('should allow renaming a receiver and update routes', () => {
      const config: PostableParsedUserConfiguration = {
        alertmanager_config: {
          ...initialAlertmanagerConfiguration.alertmanager_config,
          receivers: [{ name: 'receiver 1' }],
          route: {
            receiver: 'receiver 1',
            routes: [{ receiver: 'receiver 1' }],
          },
        },
        template_files: {},
      };

      const updatedReceiver: Receiver = { name: 'receiver 2' };
      const action = updateReceiverAction({ name: 'receiver 1', receiver: updatedReceiver });

      const result = receiversReducer(config, action);
      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result).toMatchSnapshot();
    });

    it('should allow updating an existing receiver', () => {
      const existingReceiver: Receiver = {
        name: 'existing receiver',
        email_configs: [{ to: 'address@domain.com' }],
      };

      const config: PostableParsedUserConfiguration = {
        alertmanager_config: {
          ...initialAlertmanagerConfiguration.alertmanager_config,
          receivers: [existingReceiver],
        },
        template_files: {},
      };

      const updatedReceiver: Receiver = {
        name: 'existing receiver',
        email_configs: [{ to: 'address+1@domain.com' }],
      };
      const action = updateReceiverAction({ name: 'existing receiver', receiver: updatedReceiver });

      const result = receiversReducer(config, action);
      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result).toMatchSnapshot();
    });
  });
});
