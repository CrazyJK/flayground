package jk.kamoru.flayground.base.advise;

import java.lang.reflect.Method;

import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class ExecutionTimeAdvice {

	@Around("@annotation(jk.kamoru.flayground.base.advise.TrackExecutionTime)")
	public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
		long startTime = System.currentTimeMillis();
		Object proceed = joinPoint.proceed();
		long executionTime = System.currentTimeMillis() - startTime;

		MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
		Method method = methodSignature.getMethod();
		TrackExecutionTime trackExecutionTime = method.getAnnotation(TrackExecutionTime.class);
		String message = trackExecutionTime.message();

		if (StringUtils.isBlank(message)) {
			log.info("{} -> {} ms", methodSignature.toShortString(), executionTime);
		} else {
			log.info("{} -> {} ms", message, executionTime);
		}

		return proceed;
	}

}
