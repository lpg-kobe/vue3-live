<template>
  <div class="login-wrap">
    <div class="login-container">
      <el-tabs v-model="loginMode" @tab-click="handleClick">
        <el-tab-pane label="密码登录" name="pwd">
          <el-form
            :model="accountForm"
            :rules="accountRules"
            ref="accountForm"
            label-width="100px"
            @keyup.enter="handleLogin"
          >
            <el-form-item label="手机号" prop="account">
              <el-input v-model.number="accountForm.account"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                type="password"
                v-model="accountForm.password"
                autocomplete="off"
              ></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="验证码登录" name="sms">
          <el-form
            :model="smsForm"
            :rules="smsRules"
            ref="smsForm"
            label-width="100px"
            @keyup.enter="handleLogin"
          >
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model.number="smsForm.mobile"></el-input>
            </el-form-item>
            <el-form-item label="验证码" prop="code">
              <el-input v-model="smsForm.code" autocomplete="off"></el-input>
            </el-form-item>
            <div class="send-sms-btn">
              <el-button @click="handleSendSms">{{ smsText }}</el-button>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div class="login-btn">
        <el-button type="primary" @click="handleLogin">登录</el-button>
      </div>
    </div>
  </div>
</template>
<script>
import { ElMessage } from 'element-plus'
import {
  loopToInterval,
  getStore,
  setStore,
  removeStore,
} from '../../utils/tool'
// import { ref, watch } from "vue";

export default {
  name: 'login',
  // setup() {
  //   watch();
  // },
  created() {
    // update sms coundown first init
    getStore('smsSendTime') && this.handleSmsCount(getStore('smsSendTime'))
  },
  data() {
    return {
      loginMode: 'pwd',
      smsTotal: 60,
      smsTimer: null,
      smsText: '获取验证码',
      smsDisable: false,
      accountForm: {
        account: '',
        password: '',
      },
      accountRules: {
        account: [
          {
            required: true,
            type: 'number',
            message: '请输入正确的手机号',
          },
        ],
        password: [
          {
            required: true,
            message: '请输入密码',
          },
        ],
      },
      smsRules: {
        mobile: [
          {
            required: true,
            type: 'number',
            message: '请输入正确的手机号',
          },
        ],
        code: [
          {
            required: true,
            message: '请输入正确的验证码',
          },
        ],
      },
      smsForm: {
        mobile: '',
        code: '',
      },
    }
  },
  methods: {
    handleClick() {},

    handleSendSms() {
      this.$refs.smsForm.validateField('mobile', (errMsg) => {
        if (errMsg) {
          return false
        } else {
          this.$store.dispatch({
            type: 'user/sendSms',
            payload: {
              mobile: this.smsForm.mobile,
            },
            callback: () => {
              ElMessage.success('验证码已发送')
              this.handleSmsCount(Math.ceil(new Date().getTime() / 1000))
            },
          })
        }
      })
    },

    handleLogin() {
      const smsLogin = this.loginMode === 'sms'
      this.$refs[smsLogin ? 'smsForm' : 'accountForm'].validate((pass) => {
        if (!pass) {
          return false
        }
        this.$store.dispatch({
          type: smsLogin ? 'user/smsLogin' : 'user/login',
          payload: smsLogin ? this.smsForm : this.accountForm,
        })
      })
    },

    handleSmsCount(time) {
      if (time) {
        setStore('smsSendTime', time)
      }
      this.smsTimer = loopToInterval(
        () => {
          const now = Math.ceil(new Date().getTime() / 1000)
          const smsSendTime = getStore('smsSendTime') || now
          const distance = this.smsTotal - (now - smsSendTime)
          if (distance > 0) {
            this.smsText = `${distance}s后重新发送`
            this.smsDisable = true
            return true
          } else {
            this.smsText = '获取验证码'
            removeStore('smsSendTime')
            this.smsDisable = false
            return false
          }
        },
        this.smsTimer,
        1000
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.login-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: url(../../assets/img/login/login_bg.jpg) no-repeat center top;

  .login-container {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 500px;
    min-height: 330px;
    padding: 30px 40px;
    background: rgba($color: #fff, $alpha: 0.8);
    border-radius: 10px;
    transform: translateX(-50%) translateY(-50%);

    .send-sms-btn {
      text-align: right;
    }

    .login-btn {
      text-align: center;
      margin-top: 10px;

      .el-button {
        min-width: 120px;
      }
    }
  }
}
</style>