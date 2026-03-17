import { useState, useEffect, useRef } from 'react';
import { debounce } from '../../utils';

const socialLinks = [
    {
      href: 'https://github.com/moyunzero',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48603 2 2 6.48604 2 12C2 17.514 6.48603 22 12 22C17.514 22 22 17.514 22 12C22 6.48604 17.514 2 12 2ZM12 3.5C16.7033 3.5 20.5 7.2967 20.5 12C20.5 15.8327 17.9785 19.0613 14.5 20.126V17.5684C14.5 16.6133 13.9497 15.7943 13.1543 15.3867C13.9276 15.2388 14.6457 14.9454 15.249 14.5309C15.8522 14.1165 16.3232 13.5929 16.6228 13.0037C16.9224 12.4145 17.0421 11.7765 16.9718 11.1429C16.9015 10.5093 16.6434 9.89818 16.2188 9.36035C16.4405 8.67771 16.6883 7.48034 16.0996 6.53809C14.9647 6.53809 14.2323 7.31604 13.8828 7.7998C13.2853 7.60352 12.6459 7.5017 12 7.5C11.3537 7.50057 10.7136 7.60139 10.1152 7.79688C9.76487 7.31289 9.03311 6.53809 7.90039 6.53809C7.22486 7.61941 7.64246 8.78228 7.86621 9.25684C7.41288 9.79235 7.12862 10.4078 7.03781 11.0505C6.94699 11.6931 7.05233 12.3438 7.34478 12.9468C7.63723 13.5498 8.10809 14.087 8.71698 14.5124C9.32587 14.9379 10.0546 15.2389 10.8408 15.3896C10.1877 15.7262 9.69864 16.337 9.54883 17.0781H8.8916C8.2431 17.0781 7.99112 16.8146 7.64062 16.3701C7.29463 15.9256 6.92259 15.6269 6.47559 15.5029C6.23459 15.4774 6.07223 15.6607 6.28223 15.8232C6.99173 16.3062 7.0407 17.0968 7.3252 17.6143C7.5842 18.0803 8.11484 18.5 8.71484 18.5H9.5V20.126C6.02153 19.0613 3.5 15.8327 3.5 12C3.5 7.2967 7.29669 3.5 12 3.5Z" fill="currentColor" />
      </svg>,
      alt: 'GitHub'
    },
  ];

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * 验证表单字段
 * @param {string} name - 姓名
 * @param {string} email - 邮箱
 * @param {string} message - 消息
 * @returns {Object} 错误对象
 */
const validateForm = (name, email, message) => {
    const errors = {};
    
    if (!name || name.trim().length < 2) {
        errors.name = '至少告诉我你的名字吧～';
    }
    
    if (!email) {
        errors.email = '邮箱不能为空哦';
    } else if (!validateEmail(email)) {
        errors.email = '邮箱格式好像不太对，检查一下？';
    }
    
    if (!message || message.trim().length < 10) {
        errors.message = '多说几句嘛，至少10个字～';
    }
    
    return errors;
};

const Contact = () => {
    // 表单状态
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    
    // 表单错误状态
    const [errors, setErrors] = useState({});
    
    // 提交状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 提交结果
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
    
    // 从 localStorage 恢复草稿
    useEffect(() => {
        const savedDraft = localStorage.getItem('contactFormDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setFormData(draft);
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }, []);

    // 使用 useRef 保存防抖函数，避免每次渲染都创建新函数
    const saveDraftRef = useRef(null);
    
    // 初始化防抖函数
    useEffect(() => {
        saveDraftRef.current = debounce((data) => {
            try {
                localStorage.setItem('contactFormDraft', JSON.stringify(data));
            } catch (e) {
                console.error('Failed to save draft:', e);
            }
        }, 500);
        
        return () => {
            // 清理防抖函数（如果 debounce 返回的函数有 cancel 方法）
            if (saveDraftRef.current && typeof saveDraftRef.current.cancel === 'function') {
                saveDraftRef.current.cancel();
            }
        };
    }, []);

    // 处理输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            
            // 延迟保存草稿（防抖）
            if (saveDraftRef.current) {
                saveDraftRef.current(newData);
            }
            
            return newData;
        });
        
        // 清除对应字段的错误
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 验证表单
        const validationErrors = validateForm(formData.name, formData.email, formData.message);
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setIsSubmitting(true);
        setSubmitStatus(null);
        
        try {
            const form = e.target;
            const formDataObj = new FormData(form);
            
            const response = await fetch(form.action, {
                method: 'POST',
                body: formDataObj,
            });
            
            if (response.ok) {
                setSubmitStatus('success');
                setFormData({ name: '', email: '', message: '' });
                // 清除草稿
                localStorage.removeItem('contactFormDraft');
                
                // 3秒后清除成功消息
                setTimeout(() => {
                    setSubmitStatus(null);
                }, 3000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return(
        <section
            id="contact"
            className="section"
        >
            <div className="container lg:grid lg:grid-cols-2 lg:items-stretch">
                 
                <div className="mb-12 lg:mb-0 lg:flex lg:flex-col">
                    <h2 className="headline-2 lg:max-w-[12ch] reveal-up">
                        聊聊？
                    </h2>
                    <p className="text-zinc-400 mt-3 mb-8 max-w-[50ch] lg:max-w-[30ch] reveal-up">
                        有想法、有项目、或者只是想交个朋友？随时欢迎来找我聊聊 💬
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                        {socialLinks.map(({href,icon,alt},key)=>(
                            <a
                                key={key}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 grid place-items-center ring-inset ring-2 ring-zinc-50/5 rounded-lg transition-[background-color,color] hover:bg-zinc-50 hover:text-zinc-950 active:bg-zinc-50/80 reveal-up"
                                aria-label={alt}
                            >
                                {icon}
                            </a>
                        ))}
                    </div>
                </div>
                <form
                    action="https://getform.io/f/byvvwoza"
                    method="POST"
                    className="xl:pl-10 2xl:pl-20"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="md:grid md:items-center md:grid-cols-2 md:gap-2">
                        <div className="mb-4">
                            <label
                                htmlFor="name"
                                className="label reveal-up"
                            >
                                你的名字
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                className={`text-field reveal-up ${errors.name ? 'ring-red-400 focus:ring-red-400' : ''}`}
                                autoComplete="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="怎么称呼你？"
                                aria-invalid={errors.name ? 'true' : 'false'}
                                aria-describedby={errors.name ? 'name-error' : undefined}
                            />
                            {errors.name && (
                                <p id="name-error" className="text-red-400 text-sm mt-1" role="alert">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="label reveal-up"
                            >
                                邮箱
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className={`text-field reveal-up ${errors.email ? 'ring-red-400 focus:ring-red-400' : ''}`}
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="你的邮箱地址"
                                aria-invalid={errors.email ? 'true' : 'false'}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            {errors.email && (
                                <p id="email-error" className="text-red-400 text-sm mt-1" role="alert">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="message"
                            className="label reveal-up"
                        >
                            想说的话
                        </label>
                        <textarea
                            name="message"
                            id="message"
                            className={`text-field resize-y min-h-32 max-h-80 reveal-up ${errors.message ? 'ring-red-400 focus:ring-red-400' : ''}`}
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="有什么想聊的？尽管说～"
                            aria-invalid={errors.message ? 'true' : 'false'}
                            aria-describedby={errors.message ? 'message-error' : undefined}
                        ></textarea>
                        {errors.message && (
                            <p id="message-error" className="text-red-400 text-sm mt-1" role="alert">
                                {errors.message}
                            </p>
                        )}
                    </div>

                    {/* 提交状态提示 */}
                    {submitStatus === 'success' && (
                        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm" role="alert">
                            收到啦！我会尽快回复你的 ✨
                        </div>
                    )}
                    
                    {submitStatus === 'error' && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm" role="alert">
                            哎呀，发送失败了，再试一次吧 😅
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary [&]:max-w-full w-full justify-center reveal-up"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-zinc-950"></span>
                                发送中...
                            </>
                        ) : (
                            '发送消息'
                        )}
                    </button>
                </form>
            </div>
        </section>
    )
}
export default Contact
