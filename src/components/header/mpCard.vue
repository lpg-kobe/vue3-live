<template>
  <div class="card-shadow" v-show="cardShow">
    <div class="card-dialog">
      <div class="iconfont card-dialog-close" @click="closeCardFn">&#xe615;</div>
      <h3 class="card-title">{{ $t('card.cardTitle') }}</h3>
      <div class="iconfont triangle">&#xe616;</div>
      <div class="card-bd">
        <el-form :model="cardData" :rules="rules" ref="cardForm" label-width="130px" class="card-form">
          <el-form-item :label="$t('card.nickName')" prop="nick">
            <el-input v-model="cardData.nick"></el-input>
          </el-form-item>
          <el-form-item :label="$t('card.email')" prop="email">
            <el-input v-model="cardData.email"></el-input>
          </el-form-item>
          <el-form-item :label="$t('card.phone')" prop="mobilePhone">
            <el-input v-model="cardData.mobilePhone" :maxlength="11"></el-input>
          </el-form-item>
          <el-form-item :label="$t('card.name')" prop="name">
            <el-input v-model="cardData.name"></el-input>
          </el-form-item>
          <el-form-item :label="$t('card.company')" prop="company">
            <el-input v-model="cardData.company"></el-input>
          </el-form-item>
          <el-form-item :label="$t('card.position')" prop="department">
            <el-input v-model="cardData.department"></el-input>
          </el-form-item>
          <el-form-item :label="$t('card.countries1')" prop="address" required :validate-event="false">
            <el-select class="card-select" v-model="cardData.address.countryCode" :placeholder="$t('card.countries2')" :validate-event="false">
              <el-option v-for="(item, index) of countryList" :key="index" :label="item.valueDescription" :value="item.value"></el-option>
            </el-select>
            <el-select class="card-select" v-model="cardData.address.provinceCode" :placeholder="$t('card.province')" :validate-event="false" :disabled="disabled1">
              <el-option v-for="(item, index) of provinceList" :key="index" :label="item.valueDescription" :value="item.value"></el-option>
            </el-select>
            <el-select class="card-select" v-model="cardData.address.cityCode" :placeholder="$t('card.city')" :validate-event="false" :disabled="disabled2">
              <el-option v-for="(item, index) of cityList" :key="index" :label="item.name" :value="item.name"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('card.address')" prop="detail">
            <el-input v-model="cardData.address.detail"></el-input>
          </el-form-item>
        </el-form>
        <div class="card-sub-btn" @click="cardSendBtn">{{ $t('card.submit') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { getcountry, getprovince, getcompleteinfo, updatecompleteinfo, checkmemberphoneoremail } from '../../services/room/index.js'
import { cityData } from '@/assets/js/city-data'
import { mapGetters, mapMutations } from 'vuex'
import { async } from 'q';
export default {
  name: 'mpCard',
  data () {
    var validateAddress = (rule, value, callback) => {
      if (!this.cardData.address.countryCode) {
        // 请选择国家
        callback(new Error(this.$t('card.select') + this.$t('card.countries2')))
      }
      if (this.cardData.address.countryCode === '-1') {
        callback()
        return
      }
      if (!this.cardData.address.provinceCode) {
        // 请选择省份
        callback(new Error(this.$t('card.select') + this.$t('card.province')))
      } else if (!this.cardData.address.cityCode) {
        // 请选择市/区
        callback(new Error(this.$t('card.select') + this.$t('card.city')))
      } else {
        callback()
      }
    }
    var validatePhone = (rule, value, callback) => {
      if (!(/^1[3456789]\d{9}$/.test(value))) {
        // 手机号格式不正确
        callback(new Error(this.$t('card.phoneErr')))
      } else {
        this.checkPhoneFn(value, callback)
      }
    }
    var validateEmail = (rule, value, callback) => {
      this.checkEmailFn(value, callback)
    }
    return {
      cardData: {
        account: '',
        nick: '',
        email: '',
        mobilePhone: '',
        name: '',
        company: '',
        department: '',
        address: {
          addressId: '',
          countryCode: '',
          provinceCode: '',
          cityCode: '',
          detail: ''
        }
      },
      countryList: [],
      provinceList: [],
      cityList: [],
      cityData: [],
      rules: {
        nick: [
          // 请输入昵称
          { required: true, message: this.$t('card.enter') + this.$t('card.nickName'), trigger: 'blur' },
          // 昵称不能包含特殊字符
          { pattern: /^[\u4E00-\u9FA5A-Za-z0-9]+$/, message: this.$t('card.nickErr'), trigger: 'blur' }
        ],
        email: [
          // 请输入邮箱
          { required: true, message: this.$t('card.enter') + this.$t('card.email'), trigger: 'blur' },
          // 邮箱格式不正确
          { type: 'email', message: this.$t('card.emailErr')},
          { validator: validateEmail, trigger: 'blur' }
        ],
        mobilePhone: [
          // 请输入手机号
          { required: true, message: this.$t('card.enter') + this.$t('card.phone'), trigger: 'blur' },
          { validator: validatePhone }
        ],
        name: [
          // 请输入姓名
          { required: true, message: this.$t('card.enter') + this.$t('card.name'), trigger: 'blur' }
        ],
        company: [
          // 请输入公司名称
          { required: true, message: this.$t('card.enter') + this.$t('card.company'), trigger: 'blur' }
        ],
        department: [
          // 请输入职位/部门
          { required: true, message: this.$t('card.enter') + this.$t('card.position'), trigger: 'blur' }
        ],
        address: [
          { validator: validateAddress }
        ]
      }
    }
  },
  computed: {
    ...mapGetters([
      'cardShow',
      'cardNeedOut'
    ]),
    countryCode () {
      return this.cardData.address.countryCode
    },
    provinceCode () {
      return this.cardData.address.provinceCode
    },
    disabled1 () {
      return this.cardData.address.countryCode === 'zh_CN' ? false : true
    },
    disabled2 () {
      return this.cardData.address.provinceCode ? false : true
    }
  },
  watch: {
    provinceCode (val) {
      this.cityData.forEach(item => {
        if (val === item.val) {
          this.cityList = item.city
        }
      })
      this.cardData.address.cityCode = ''
    },
    countryList (val) {
      console.log(val, 'val')
    },
    countryCode (val) {
      if (val !== 'zh_CN') {
        this.cardData.address.provinceCode = ''
        this.cardData.address.cityCode = ''
      }
    }
  },
  methods: {
    ...mapMutations([
      'closeCard'
    ]),
    closeCardFn () {
      if (this.cardNeedOut) {
        this.$confirm(this.$t('common.closeQuit'), this.$t('common.hint'), {
          confirmButtonText: this.$t('common.affirm'),
          cancelButtonText: this.$t('common.cancel'),
          type: "warning",
        }).then(() => {
          window.location.href = 'https://live.ofweek.com/'
        })
      } else {
        this.closeCard()
      }
    },
    checkPhoneFn (phone, callback) {
      checkmemberphoneoremail({phoneOremail: phone, type: 1}).then(res => {
        if (res.code === 0) {
          return callback()
        } else if (res.code === 1) {
          // 该手机号已被占用
          return callback(new Error(this.$t('login.phoneErr2')))
        } else {
          return callback(new Error(res.message))
        }
      })
    },
    checkEmailFn (phone, callback) {
      checkmemberphoneoremail({phoneOremail: phone, type: 2}).then(res => {
        if (res.code === 0) {
          return callback()
        } else if (res.code === 1) {
          // 该邮箱已被占用
          return callback(new Error(this.$t('card.emailErr2')))
        } else {
          return callback(new Error(res.message))
        }
      })
    },
    async getcountry () {
      getcountry().then(res => {
        console.log(res, 'sss')
        if (res.code === 0) {
          this.countryList = res.data
        }
      })
    },
    async getprovince () {
      getprovince().then(res => {
        if (res.code === 0) {
          this.provinceList = res.data
        }
      })
    },
    getcompleteinfo () {
      getcompleteinfo().then(res => {
        if (res.code === 0) {
          let citytxt = res.data.address.cityCode
          this.cardData = res.data
          setTimeout(() => {
            this.cardData.address.cityCode = citytxt
          }, 300);
        } else if (res.code === -8) {
          // this.$message.error(res.message)
        }
      })
    },
    cardSendBtn () {
      this.$refs.cardForm.validate((valid) => {
        if (valid) {
          updatecompleteinfo(this.cardData).then(res => {
            if (res.code === 0) {
              location.reload()
            } else {
              this.$message.error(res.message)
            }
          })
        } else {
          return false
        }
      })
    }
  },
  created () {
    this.cityData = cityData
    this.getcountry().then(() => {
      this.getprovince().then(() => {
        this.getcompleteinfo()
      })
    })
  }
}
</script>

<style lang="scss" scoped>
.card-shadow{ display: block; position: fixed; left: 0; top: 0; z-index: 1000; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
.card-dialog{ position: fixed; left: 50%; top: 50%; width: 600px; margin: 0 0 0 -175px; transform: translateY(-50%); font: normal 14px/1.5 "Microsoft Yahei"; letter-spacing: 1px; }
.card-dialog a:link, .card-dialog a:visited{ color: #108EE9; text-decoration: none; }
.card-dialog a:hover{ color: #CC0000; text-decoration: underline; }
.card-dialog-close{ position: absolute;right: 0; top: 0; width: 24px; height: 24px; text-align: center; line-height: 24px; font-size: 14px; color: #fff; cursor: pointer; }
.card-title{ padding: 0; margin: 0 auto 10px; text-align: center; font-weight: normal; font-size: 16px; color: #fff; }
.card-dialog .triangle{ text-align: center; color: #fff; margin-bottom: -3px; line-height: 1; }
.card-bd{ overflow: hidden; padding: 24px; background: #fff; border-radius: 10px; }

.card-sub-btn {
  width: 200px;
  height: 40px;
  color: #fff;
  background: #CC0000;
  border: 0;
  border-radius: 4px;
  outline: none;
  margin: 0 auto;
  text-align: center;
  line-height: 40px;
  cursor: pointer;
  user-select: none;
}
.card-select {
  width: 137px;
}
</style>
