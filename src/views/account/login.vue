<template>
  <div class="login-container">
    <div class="login-form">
      <div class="title-container">
        <h3 class="title">欢迎使用 Data Vortex <span>(v{{version}})</span></h3>
      </div>

      <div class="auth-diagram">
        <div class="auth-circle">
          <img class="auth-circle-img" :src="logoBaidu" alt="百度 logo" />
        </div>

        <div class="auth-arrow">
          <span class="auth-arrow-text">授 权</span>
          <span class="auth-arrow-icon">-- ✅ --</span>
        </div>

        <div class="auth-circle">
          <img class="auth-circle-img" :src="logoApp" alt="Data Vortex logo" />
        </div>
      </div>

      <div class="auth-button-wrapper">
        <el-button
          size="large"
          :loading="loading"
          type="primary"
          class="auth-button"
          @click.prevent="handleLogin"
        >
          开始
        </el-button>
      </div>

      <div class="tips tips-center">
        <span>致力于建设垂类整合的模型&数据的服务平台!  ✌🏻(＾－＾)V</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { dispatch } from '@/store'
import {
  DATA_VORTEX_LS_TOKEN_ID,
  setPreAuthToken,
} from '@/store/storage'
import {
  parseJwtPayload,
  resolveUserFromLogin,
  usernameToToken,
  setJwt,
} from '@/utils/auth'
import logoBaidu from '@/assets/logo_baidu.svg'
import logoApp from '@/assets/logo.svg'
import {fetch_token} from '@baidu/zerotrust-cross'


const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const redirect = route.query.redirect || '/'

// 点击”获取授权”：
// 1. 从当前上下文获取 JWT（由后端根据 Header: X-Zt-Authorization 注入）
// 2. 保存 JWT 至 LocalStorage（data_vortex_jwt）
// 3. 解析 JWT，得到 name / username / groups
// 4. 使用 username 通过 SHA-256 生成 token（data_vortex_auth_token）
// 5. 将 token 写入 LocalStorage，并更新全局 store
// 6. 跳转到目标页面
const handleLogin = async () => {
  try {
    loading.value = true

    // 0. 获取零信任预认证 token 并存入 localStorage（供全局请求拦截器使用）
    const pre_auth_token = await fetch_token('https://vortex-api.n.baidu-int.com/')
    console.log('pre_auth_token', pre_auth_token)
    setPreAuthToken(pre_auth_token)

    // 1. 调用后端登录接口，获取用户信息（含 jwt、groups）
    const loginUser = await resolveUserFromLogin()
    const jwt = loginUser?.jwt
    if (!jwt) {
      ElMessage.error('未获取到网关提供的认证信息（X-Zt-Authorization），请联系管理员 👷🏻‍♂️ v_limengjie@baidu.com 检查配置')
      return
    }

    // 2. 保存 JWT 至 LocalStorage
    setJwt(jwt)

    // 3. 解析 JWT
    const payload = parseJwtPayload(jwt)
    if (!payload) {
      ElMessage.error('JWT 解析失败，请联系管理员 👷🏻‍♂️ v_limengjie@baidu.com')
      return
    }

    const username =
      payload.username ||
      payload.user_name ||
      payload.sub
    const name = payload.name || username || ''

    if (!username) {
      ElMessage.error('JWT 中未找到 username 信息，请联系管理员 👷🏻‍♂️ v_limengjie@baidu.com')
      return
    }

    // 4. 根据 username 生成 token（与 hashlib.sha256(username).hexdigest() 一致）
    const token = await usernameToToken(username)

    // 5. 保存 token 至 LocalStorage，并同步到全局 store
    localStorage.setItem(DATA_VORTEX_LS_TOKEN_ID, token)
    dispatch.user.setToken(token)

    // 6. 保存用户信息（groups 取后端登录响应，最新最准确）
    const userInfo = {
      username,
      name,
      groups: Array.isArray(loginUser.groups) ? loginUser.groups : [],
    }
    dispatch.user.saveInfo(userInfo)
	ElNotification({
      title: `欢迎 ${name} 🎉`,
      message: `很高兴你能选择使用 Data Vortex!`,
      type: 'success',
    })

    // 7. 跳转到目标页面
    router.push(redirect)
  } catch (e) {
    console.error(e)
    ElMessage.error('授权登录失败，请稍后重试或联系管理员 👷🏻‍♂️ v_limengjie@baidu.com')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
	.login-container .el-input input {
		color: $cursor;
	}
}

/* reset element-ui css */
.login-container {
	.el-input {
		.el-input__wrapper {
			background: transparent;
			box-shadow: none;
		}

		input {
			-webkit-appearance: none;
			color: $light_gray;
			caret-color: $cursor;

			&:-webkit-autofill {
				box-shadow: 0 0 0px 1000px transparent inset !important;
				-webkit-text-fill-color: $cursor !important;
				transition: background-color 50000s ease-in-out 0s; //背景色透明 生效时长 过渡效果 启用时延迟的时间
			}
		}
	}

	.el-form-item {
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.1);
		border-radius: 5px;
	}
}
</style>

<style lang="scss" scoped>
$bg: #243342;
$dark_gray: #a8b4c0;
$light_gray: #f5f7fa;

.login-container {
	min-height: 100vh;
	width: 100%;
	background: radial-gradient(circle at top, #32485e 0, #243342 55%, #1c2935 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	box-sizing: border-box;

	.login-form {
		width: 620px;
		max-width: 100%;
		padding: 40px 48px 0;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.tips {
		font-size: 13px;
		color: $dark_gray;
		margin-bottom: 10px;

		span {
			&:first-of-type {
				margin-right: 16px;
			}
		}
	}

	.title-container {
		position: relative;
		margin-bottom: 56px;

		.title {
			font-size: 30px;
			color: $light_gray;
			margin: 0 auto;
			text-align: center;
			font-weight: 600;
			letter-spacing: 1px;
		}
	}
}

.auth-diagram {
	display: flex;
	align-items: center;
	justify-content: center;
	column-gap: 40px;
	margin-bottom: 96px;
}

.auth-circle {
	width: 180px;
	max-height: 180px;
	border-radius: 10%;
	border: 2px solid rgba(255, 255, 255, 0.92);
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	background: radial-gradient(circle at 30% 10%, rgba(255, 255, 255, 0.16), transparent 55%);
	box-shadow: 0 18px 40px rgba(250, 249, 249, 0.4);
	overflow: hidden; // 确保内部内容也被裁剪成正圆
}

.auth-circle-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 10%; // logo 本身也保持正圆
}

.auth-arrow {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: $light_gray;
	font-size: 16px;
	row-gap: 12px;
	min-width: 56px;
}

.auth-arrow-icon {
	font-size: 24px;
}

.auth-button-wrapper {
	max-width: 100%;
	margin: 0 auto 40px;
	border: 1px solid rgba(255, 255, 255, 0.9);
	box-sizing: border-box;
	border-radius: 2px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.auth-button {
	width: 100%;
	// background-color: transparent !important;

	border: none !important;
	color: #fff !important;
	border-radius: 0;
	letter-spacing: 10px;
	font-size: 18px;
	font-weight: 700;
}

.tips-center {
	text-align: center;
	color: $dark_gray;
}
</style>
