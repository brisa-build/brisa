import { describe, expect, it } from "bun:test";
import transformComponentStatics from ".";
import { normalizeQuotes } from "../../../helpers";
import AST from "../../ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("transform-component-statics", () => {
      it("should add 'r' to subeffects", () => {
        const input = `
        export default function Component() {
          return 'Hello World';
        }

        Component.suspense = ({ foo }, {effect}) => {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Suspense';
        };

        Component.error = ({ foo }, {effect}) => {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Error';
        };
       `;
        const expected = normalizeQuotes(`
            export default function Component() {
              return 'Hello World';
            }

            Component.suspense = ({foo}, {effect}) => {
              effect(r => {
                effect(r(r1 => {
                  console.log(foo);
                }));
              });

              return 'Hello Suspense';
            };

            Component.error = ({foo}, {effect}) => {
              effect(r => {
                effect(r(r1 => {
                  console.log(foo);
                }));
              });

              return 'Hello Error';
            };
           `);

        const ast = parseCodeToAST(input);
        const reactiveAst = transformComponentStatics(
          ast,
          "Component",
          new Set()
        );
        const outputCode = normalizeQuotes(generateCodeFromAST(reactiveAst));

        expect(outputCode).toBe(expected);
      });

      it("should add 'r' to subeffects when suspense and error are identifiers", () => {
        const input = `
        export default function Component() {
          return 'Hello World';
        }

        function Suspense({ foo }, {effect}) {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Suspense';
        }

        function Error({ foo }, {effect}) {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Error';
        }

        Component.suspense = Suspense;
        Component.error = Error;
       `;
        const expected = normalizeQuotes(`
          let Suspense = function ({foo}, {effect}) {
            effect(r => {
              effect(r(r1 => {
                console.log(foo);
              }));
            });
            return "Hello Suspense";
          }, Error = function ({foo}, {effect}) {
            effect(r => {
              effect(r(r1 => {
                console.log(foo);
              }));
            });
            return "Hello Error";
          };

          export default function Component() {
            return 'Hello World';
          }

          Component.suspense = Suspense;
          Component.error = Error;
        `);

        const ast = parseCodeToAST(input);
        const reactiveAst = transformComponentStatics(
          ast,
          "Component",
          new Set()
        );
        const outputCode = normalizeQuotes(generateCodeFromAST(reactiveAst));

        expect(outputCode).toBe(expected);
      });

      it("should add 'r' to subeffects when suspense and error are identifiers in arrow functions", () => {
        const input = `
        export default function Component() {
          return 'Hello World';
        }

        const Suspense = ({ foo }, {effect}) => {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Suspense';
        };

        const Error = ({ foo }, {effect}) => {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Error';
        };

        Component.suspense = Suspense;
        Component.error = Error;
       `;
        const expected = normalizeQuotes(`
          export default function Component() {
            return "Hello World";
          }
          
          const Suspense = ({foo}, {effect}) => {
            effect(r => {
              effect(r(r1 => {
                console.log(foo);
              }));
            });

            return "Hello Suspense";
          };
          
          const Error = ({foo}, {effect}) => {
            effect(r => {
              effect(r(r1 => {
                console.log(foo);
              }));
            });

            return "Hello Error";
          };
          
          Component.suspense = Suspense;
          Component.error = Error;
        `);

        const ast = parseCodeToAST(input);
        const reactiveAst = transformComponentStatics(
          ast,
          "Component",
          new Set()
        );
        const outputCode = normalizeQuotes(generateCodeFromAST(reactiveAst));

        expect(outputCode).toBe(expected);
      });

      it("should add 'r' to subeffects when suspense and error are in Object.assign identifiers", () => {
        const input = `
        export default function Component() {
          return 'Hello World';
        }

        const Suspense = ({ foo }, {effect}) => {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Suspense';
        };

        const Error = ({ foo }, {effect}) => {
          effect(() => {
            effect(() => {
              console.log(foo);
            })
          });

          return 'Hello Error';
        };

        Object.assign(Component, { suspense: Suspense, error: Error });
       `;
        const expected = normalizeQuotes(`
          export default function Component() {
            return "Hello World";
          }
          
          const Suspense = ({foo}, {effect}) => {
            effect(r => {
              effect(r(r1 => {
                console.log(foo);
              }));
            });

            return "Hello Suspense";
          };
          
          const Error = ({foo}, {effect}) => {
            effect(r => {
              effect(r(r1 => {
                console.log(foo);
              }));
            });
            
            return "Hello Error";
          };
          
          Object.assign(Component, {suspense: Suspense,error: Error});
        `);

        const ast = parseCodeToAST(input);
        const reactiveAst = transformComponentStatics(
          ast,
          "Component",
          new Set()
        );
        const outputCode = normalizeQuotes(generateCodeFromAST(reactiveAst));

        expect(outputCode).toBe(expected);
      });

      it("should add 'r' to subeffects when suspense and error are in Object.assign", () => {
        const input = `
        export default function Component() {
          return 'Hello World';
        }

        Object.assign(Component, { 
          suspense: ({ foo }, {effect}) => {
            effect(() => {
              effect(() => {
                console.log(foo);
              });
            }); 
            return 'Hello Suspense';
          },
          error: ({ foo }, {effect}) => {
            effect(() => {
              effect(() => {
                console.log(foo);
              })
            });
        
            return 'Hello Error';
          },
        });
       `;
        const expected = normalizeQuotes(`
          export default function Component() {
            return 'Hello World';
          }

          Object.assign(Component, { 
            suspense: ({foo}, {effect}) => {
              effect(r => {
                effect(r(r1 => {
                  console.log(foo);
                }));
              }); 
              return 'Hello Suspense';
            },
            error: ({foo}, {effect}) => {
              effect(r => {
                effect(r(r1 => {
                  console.log(foo);
                }));
              });
          
              return 'Hello Error';
            }
          });
        `);

        const ast = parseCodeToAST(input);
        const reactiveAst = transformComponentStatics(
          ast,
          "Component",
          new Set()
        );
        const outputCode = normalizeQuotes(generateCodeFromAST(reactiveAst));

        expect(outputCode).toBe(expected);
      });

      it("should add 'r' to subeffects when suspense and error are in Object.assign as methods", () => {
        const input = `
        export default function Component() {
          return 'Hello World';
        }

        Object.assign(Component, { 
          suspense({ foo }, {effect}) {
            effect(() => {
              effect(() => {
                console.log(foo);
              });
            }); 
            return 'Hello Suspense';
          },
          error({ foo }, {effect}) {
            effect(() => {
              effect(() => {
                console.log(foo);
              })
            });
        
            return 'Hello Error';
          },
        });
       `;
        const expected = normalizeQuotes(`
          export default function Component() {
            return "Hello World";
          }
          
          Object.assign(Component, { 
            suspense({foo}, {effect}) {
              effect(r => {
                effect(r(r1 => {
                  console.log(foo);
                }));
              }); 
              return 'Hello Suspense';
            },
            error({foo}, {effect}) {
              effect(r => {
                effect(r(r1 => {
                  console.log(foo);
                }));
              });
          
              return 'Hello Error';
            }
          });
        `);

        const ast = parseCodeToAST(input);
        const reactiveAst = transformComponentStatics(
          ast,
          "Component",
          new Set()
        );
        const outputCode = normalizeQuotes(generateCodeFromAST(reactiveAst));

        expect(outputCode).toBe(expected);
      });
    });
  });
});
