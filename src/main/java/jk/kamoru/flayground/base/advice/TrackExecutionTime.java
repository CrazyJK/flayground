package jk.kamoru.flayground.base.advice;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TrackExecutionTime {

	static enum LEVEL {
		DEBUG, INFO, WARN, ERROR;
	}

	String message() default "";

	LEVEL level() default LEVEL.DEBUG;

}
